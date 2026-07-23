package com.example.carenest.payment;

import java.util.UUID;

import com.example.carenest.payment.dto.InitiatePaymentRequest;
import com.example.carenest.payment.dto.PaymentResponse;

public interface PaymentService {

    PaymentResponse initiatePayment(InitiatePaymentRequest request);

    /**
     * @param rawPayload      the exact raw request body Paystack sent (must be
     *                        used as-is for HMAC verification - do NOT
     *                        re-serialize a parsed object, the bytes must match)
     * @param signatureHeader value of the "x-paystack-signature" header
     */
    void handleWebhook(String rawPayload, String signatureHeader);

    PaymentResponse getPaymentById(UUID paymentId);

    PaymentResponse getPaymentByBookingId(UUID bookingId);
}