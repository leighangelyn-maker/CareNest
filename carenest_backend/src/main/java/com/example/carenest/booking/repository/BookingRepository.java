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

    /**
     * Same overlap logic as above, but scoped to a specific worker - used
     * when an agency assigns a worker to a booking, so the same worker can't
     * end up double-booked across two different families' requests.
     * Excludes the booking currently being assigned (excludeBookingId) so a
     * booking doesn't "conflict with itself" when re-checked.
     */
    @Query("""
        SELECT b FROM Booking b
        WHERE b.worker.id = :workerId
        AND b.id <> :excludeBookingId
        AND b.status <> com.example.carenest.booking.BookingStatus.CANCELLED
        AND b.startTime < :endTime
        AND b.endTime > :startTime
        """)
    List<Booking> findOverlappingBookingsForWorker(
            @Param("workerId") UUID workerId,
            @Param("excludeBookingId") UUID excludeBookingId,
            @Param("startTime") OffsetDateTime startTime,
            @Param("endTime") OffsetDateTime endTime
    );

    List<Booking> findByStatus(BookingStatus status);
}