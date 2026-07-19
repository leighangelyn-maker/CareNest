package com.example.carenest.payment.dto;

import com.example.carenest.payment.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

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
    private String paystackTransactionId;
    private String authorizationUrl;
    private Instant paidAt;
}
