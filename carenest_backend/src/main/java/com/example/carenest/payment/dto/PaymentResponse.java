package com.example.carenest.payment.dto;

import com.example.carenest.payment.PaymentStatus;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class PaymentResponse {
    private UUID id;
    private UUID bookingId;
    private Integer amountPesewas;
    private PaymentStatus status;
    private OffsetDateTime paidAt;
}
