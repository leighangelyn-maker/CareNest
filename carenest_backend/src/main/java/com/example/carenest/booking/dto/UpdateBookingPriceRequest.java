package com.example.carenest.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBookingPriceRequest {

    @NotNull(message = "Hourly rate is required")
    @Positive(message = "Hourly rate must be positive")
    private Integer hourlyRateMinorUnits;
}