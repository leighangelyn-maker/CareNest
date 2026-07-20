package com.example.carenest.booking;

//importing the required packages
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.example.carenest.agency.Agency;
import com.example.carenest.common.ServiceCategory;
import com.example.carenest.family.FamilyAddress;
import com.example.carenest.family.FamilyProfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

//Defining the Booking entity and mapping it to the "bookings" table in the database.
@Entity
@Table
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "family_id", nullable = false)
    private FamilyProfile family;

    @ManyToOne
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private ServiceCategory serviceCategory;

    @ManyToOne
    @JoinColumn(name = "address_id", nullable = false)
    private FamilyAddress familyAddress;

    @Column(name = "status", nullable = false)
    private BookingStatus status;

    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private OffsetDateTime endTime;

    @Column(name = "is_recurring")
    private Boolean isRecurring;

    @Column(name = "recurrence_rule")
    private String recurrenceRule;

    @Column(name = "hourly_rate_minor_units")
    private Integer hourlyRateMinorUnits;

    @Column(name = "total_hours", nullable = false)
    private BigDecimal totalHours;

    @Column(name = "subtotal_minor_units")
    private Integer subtotalMinorUnits;

    @Column(name = "platform_fee_pct")
    private BigDecimal platformFeePct;

    @Column(name = "platform_fee_minor_units")
    private Integer platformFeeMinorUnits;

    @Column(name = "agency_payout_minor_units")
    private Integer agencyPayoutMinorUnits;

    @Column(name = "family_notes")
    private String familyNotes;

    @Column(name = "agency_notes")
    private String agencyNotes;

    @Column(name = "cancelled_by")
    private String cancelledBy;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}