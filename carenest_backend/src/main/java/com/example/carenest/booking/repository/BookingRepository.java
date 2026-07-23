package com.example.carenest.booking.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.carenest.booking.Booking;
import com.example.carenest.booking.BookingStatus;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByFamily_IdOrderByStartTimeDesc(UUID familyId);

    List<Booking> findByAgency_IdOrderByStartTimeDesc(UUID agencyId);

    List<Booking> findByAgencyId(UUID agencyId);

    List<Booking> findByAgencyIdAndStatus(UUID agencyId, BookingStatus status);

    /**
     * Conflict detection: finds any existing, non-cancelled bookings for the
     * same family whose time window overlaps the requested window.
     * Overlap condition: existing.start < newEnd AND existing.end > newStart
     *
     * NOTE: this checks conflicts at the FAMILY level (a family shouldn't be
     * able to double-book itself). Once a Worker-level assignment entity
     * exists, add an equivalent overlap check scoped to the assigned worker
     * so two families can't book the same worker for overlapping times.
     */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.family.id = :familyId
        AND b.status <> com.example.carenest.booking.BookingStatus.CANCELLED
        AND b.startTime < :endTime
        AND b.endTime > :startTime
        """)
    List<Booking> findOverlappingBookingsForFamily(
            @Param("familyId") UUID familyId,
            @Param("startTime") OffsetDateTime startTime,
            @Param("endTime") OffsetDateTime endTime
    );

    List<Booking> findByStatus(BookingStatus status);
}