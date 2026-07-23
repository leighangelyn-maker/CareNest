package com.example.carenest.payment;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.common.dto.response.ApiResponse;
import com.example.carenest.payment.dto.InitiatePaymentRequest;
import com.example.carenest.payment.dto.PaymentResponse;

@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request) {
        PaymentResponse response = paymentService.initiatePayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Payment initiated successfully"));
    }

    /**
     * Paystack webhook receiver. Must accept the RAW request body (not a
     * parsed DTO) because HMAC verification needs the exact bytes Paystack
     * signed. Do not add @Valid / bind this to a typed object at the
     * controller level.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "x-paystack-signature", required = false) String signature) {
        log.info("Received Paystack webhook");
        paymentService.handleWebhook(rawPayload, signature);
        // Paystack expects a 200 with no particular body to acknowledge receipt.
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(@PathVariable UUID id) {
        PaymentResponse response = paymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment retrieved successfully"));
    }

    @GetMapping("/callback-placeholder")
    public ResponseEntity<String> callbackPlaceholder(@RequestParam(required = false) String reference) {
        return ResponseEntity.ok("Payment processed. Reference: " + reference + ". You may close this window.");
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByBooking(@PathVariable UUID bookingId) {
        PaymentResponse response = paymentService.getPaymentByBookingId(bookingId);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment retrieved successfully"));
    }
}