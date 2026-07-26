package com.example.carenest.booking.dto;

import jakarta.validation.constraints.NotNull;

import com.example.carenest.booking.BookingStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBookingStatusRequest {

    @NotNull(message = "Status is required")
    private BookingStatus status;

    // Populated by the service layer when status is CANCELLED (not required
    // from the client on every call, but validated when status = CANCELLED).
    private String cancellationReason;

    private String agencyNotes;
}