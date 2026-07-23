package com.example.carenest.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.carenest.booking.Booking;
import com.example.carenest.booking.BookingStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private UUID id;
    private UUID familyId;
    private UUID agencyId;
    private UUID serviceCategoryId;
    private UUID familyAddressId;
    private BookingStatus status;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Boolean isRecurring;
    private String recurrenceRule;
    private Integer hourlyRateMinorUnits;
    private BigDecimal totalHours;
    private Integer subtotalMinorUnits;
    private BigDecimal platformFeePct;
    private Integer platformFeeMinorUnits;
    private Integer agencyPayoutMinorUnits;
    private String familyNotes;
    private String agencyNotes;
    private String cancelledBy;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookingResponse fromEntity(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .familyId(booking.getFamily().getId())
                .agencyId(booking.getAgency().getId())
                .serviceCategoryId(booking.getServiceCategory().getId())
                .familyAddressId(booking.getFamilyAddress().getId())
                .status(booking.getStatus())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .isRecurring(booking.getIsRecurring())
                .recurrenceRule(booking.getRecurrenceRule())
                .hourlyRateMinorUnits(booking.getHourlyRateMinorUnits())
                .totalHours(booking.getTotalHours())
                .subtotalMinorUnits(booking.getSubtotalMinorUnits())
                .platformFeePct(booking.getPlatformFeePct())
                .platformFeeMinorUnits(booking.getPlatformFeeMinorUnits())
                .agencyPayoutMinorUnits(booking.getAgencyPayoutMinorUnits())
                .familyNotes(booking.getFamilyNotes())
                .agencyNotes(booking.getAgencyNotes())
                .cancelledBy(booking.getCancelledBy())
                .cancellationReason(booking.getCancellationReason())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}