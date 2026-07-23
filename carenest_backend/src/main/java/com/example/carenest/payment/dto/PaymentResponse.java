package com.example.carenest.payment.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

import com.example.carenest.payment.Payment;
import com.example.carenest.payment.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private UUID id;
    private UUID bookingId;
    private Integer amountMinorUnits;
    private String currency;
    private PaymentStatus status;
    private String paystackReference;

    // Only populated on initiate; the URL the frontend should redirect the
    // family to in order to complete payment on Paystack's hosted page.
    private String authorizationUrl;

    private Instant paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaymentResponse fromEntity(Payment payment) {
        return fromEntity(payment, null);
    }

    public static PaymentResponse fromEntity(Payment payment, String authorizationUrl) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .bookingId(payment.getBooking().getId())
                .amountMinorUnits(payment.getAmountMinorUnits())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .paystackReference(payment.getPaystackReference())
                .authorizationUrl(authorizationUrl)
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}