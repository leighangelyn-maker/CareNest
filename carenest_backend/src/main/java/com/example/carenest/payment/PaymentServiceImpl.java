package com.example.carenest.payment;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.booking.Booking;
import com.example.carenest.booking.BookingStatus;
import com.example.carenest.booking.repository.BookingRepository;
import com.example.carenest.common.exception.BadRequestException;
import com.example.carenest.common.exception.ResourceNotFoundException;
import com.example.carenest.notification.NotificationService;
import com.example.carenest.notification.NotificationType;
import com.example.carenest.payment.dto.InitiatePaymentRequest;
import com.example.carenest.payment.dto.PaymentResponse;
import com.example.carenest.payment.dto.PaystackWebhookPayload;
import com.example.carenest.payment.repository.PaymentRepository;

/**
 * NOTE: this class implements its own HMAC-SHA512 verification inline for
 * completeness. If a shared Paystack signature-verification utility already
 * exists elsewhere in the codebase (per the webhook validation work already
 * done), delete verifySignature() here and call that instead - don't keep
 * two implementations of the same check.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final String PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize";

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    @Value("${paystack.secret-key}")
    private String paystackSecretKey;

    @Value("${paystack.callback-url}")
    private String callbackUrl;

    @Override
    @Transactional
    public PaymentResponse initiatePayment(InitiatePaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.getBookingId()));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay for a cancelled booking");
        }

        paymentRepository.findByBooking_Id(booking.getId()).ifPresent(existing -> {
            if (existing.getStatus() == PaymentStatus.PAID) {
                throw new BadRequestException("This booking has already been paid for");
            }
        });

        String reference = "CN-" + UUID.randomUUID();

        Payment payment = Payment.builder()
                .booking(booking)
                .familyProfile(booking.getFamily())
                .amountMinorUnits(booking.getSubtotalMinorUnits())
                .currency("GHS")
                .status(PaymentStatus.PENDING)
                .paystackReference(reference)
                .build();

        String authorizationUrl = callPaystackInitialize(booking, reference);

        // Paystack's transaction id isn't known until the callback/webhook fires,
        // so this is set once handleWebhook() processes the event.
        payment.setPaystackTransactionId("");

        Payment saved = paymentRepository.save(payment);
        log.info("Payment {} initiated for booking {} with reference {}", saved.getId(), booking.getId(), reference);

        return PaymentResponse.fromEntity(saved, authorizationUrl);
    }

    @Override
    @Transactional
    public void handleWebhook(String rawPayload, String signatureHeader) {
        if (!verifySignature(rawPayload, signatureHeader)) {
            log.warn("Rejected Paystack webhook: signature mismatch");
            throw new BadRequestException("Invalid webhook signature");
        }

        PaystackWebhookPayload payload = parsePayload(rawPayload);
        if (payload.getData() == null || payload.getData().getReference() == null) {
            log.warn("Rejected Paystack webhook: missing reference");
            throw new BadRequestException("Malformed webhook payload");
        }

        Payment payment = paymentRepository.findByPaystackReference(payload.getData().getReference())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No payment found for reference: " + payload.getData().getReference()));

        if (payment.getStatus() == PaymentStatus.PAID) {
            log.info("Webhook for already-paid payment {} ignored (idempotent)", payment.getId());
            return;
        }

        boolean isSuccess = "charge.success".equalsIgnoreCase(payload.getEvent())
                && "success".equalsIgnoreCase(payload.getData().getStatus());

        Booking booking = payment.getBooking();

        if (isSuccess) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(java.time.Instant.now());
            if (payload.getData().getTransactionId() != null) {
                payment.setPaystackTransactionId(String.valueOf(payload.getData().getTransactionId()));
            }
            log.info("Payment {} marked PAID via webhook", payment.getId());

            notificationService.create(
                    booking.getFamily().getUser(),
                    NotificationType.PAYMENT_RECEIVED,
                    "Payment received",
                    "Your payment for this booking was received successfully.",
                    booking.getId());
            notificationService.create(
                    booking.getAgency().getUser(),
                    NotificationType.PAYMENT_RECEIVED,
                    "Payment received",
                    "Payment has been received for a booking.",
                    booking.getId());
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            log.info("Payment {} marked FAILED via webhook (event={})", payment.getId(), payload.getEvent());

            notificationService.create(
                    booking.getFamily().getUser(),
                    NotificationType.PAYMENT_FAILED,
                    "Payment failed",
                    "Your payment for this booking could not be processed. Please try again.",
                    booking.getId());
        }

        paymentRepository.save(payment);
    }

    @Override
    public PaymentResponse getPaymentById(UUID paymentId) {
        return PaymentResponse.fromEntity(findPaymentOrThrow(paymentId));
    }

    @Override
    public PaymentResponse getPaymentByBookingId(UUID bookingId) {
        Payment payment = paymentRepository.findByBooking_Id(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No payment found for booking: " + bookingId));
        return PaymentResponse.fromEntity(payment);
    }

    private Payment findPaymentOrThrow(UUID paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
    }

    /**
     * Calls Paystack's initialize-transaction endpoint. Amount must be sent in
     * the smallest currency unit (pesewas for GHS), which matches how amounts
     * are already stored (amountMinorUnits).
     */
    private String callPaystackInitialize(Booking booking, String reference) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(paystackSecretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("email", resolveFamilyEmail(booking));
        body.put("amount", booking.getSubtotalMinorUnits());
        body.put("reference", reference);
        body.put("callback_url", callbackUrl);
        body.put("currency", "GHS");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    PAYSTACK_INITIALIZE_URL, entity, Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> data = response != null ? (Map<String, Object>) response.get("data") : null;

            if (data == null || data.get("authorization_url") == null) {
                throw new BadRequestException("Paystack did not return an authorization URL");
            }
            return (String) data.get("authorization_url");
        } catch (Exception ex) {
            log.error("Failed to initialize Paystack transaction for reference {}: {}", reference, ex.getMessage());
            throw new BadRequestException("Unable to initialize payment with Paystack");
        }
    }

    // ASSUMPTION: FamilyProfile exposes the user's email, possibly via a
    // linked User entity. Adjust this accessor to match your actual model.
    private String resolveFamilyEmail(Booking booking) {
        return booking.getFamily().getUser().getEmail();
    }

    private boolean verifySignature(String rawPayload, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(paystackSecretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            String computed = bytesToHex(hash);
            return computed.equalsIgnoreCase(signatureHeader);
        } catch (Exception ex) {
            log.error("Error verifying Paystack webhook signature: {}", ex.getMessage());
            return false;
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private PaystackWebhookPayload parsePayload(String rawPayload) {
        try {
            return objectMapper.readValue(rawPayload, PaystackWebhookPayload.class);
        } catch (Exception ex) {
            throw new BadRequestException("Unable to parse webhook payload");
        }
    }
}