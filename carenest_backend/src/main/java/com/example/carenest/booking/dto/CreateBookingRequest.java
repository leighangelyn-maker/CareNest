package com.example.carenest.booking.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.validation.constraints.Future;
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
public class CreateBookingRequest {

    @NotNull(message = "Agency is required")
    private UUID agencyId;

    @NotNull(message = "Service category is required")
    private UUID serviceCategoryId;

    @NotNull(message = "Family address is required")
    private UUID familyAddressId;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private OffsetDateTime startTime;

    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    private OffsetDateTime endTime;

    private Boolean isRecurring;

    private String recurrenceRule;

    // Optional at creation time - no worker is assigned yet, so there's
    // usually no rate to know. If provided, it's used as a starting price
    // (and marks the booking as price-overridden, since it's a manual
    // family/agency-supplied number rather than inherited from a worker).
    // Once a worker is assigned via PATCH /bookings/{id}/assign-worker,
    // their defaultHourlyRateMinorUnits fills this in if it's still null.
    @Positive(message = "Hourly rate must be positive")
    private Integer hourlyRateMinorUnits;

    private String familyNotes;
}