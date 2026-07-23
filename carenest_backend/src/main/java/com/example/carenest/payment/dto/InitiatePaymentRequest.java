package com.example.carenest.payment.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiatePaymentRequest {

    @NotNull(message = "Booking id is required")
    private UUID bookingId;
}