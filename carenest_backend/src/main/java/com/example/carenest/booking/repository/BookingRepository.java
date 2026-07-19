package com.example.carenest.booking.repository;

import com.example.carenest.booking.Booking;
import com.example.carenest.booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    
    List<Booking> findByFamilyId(UUID familyId);
    
    List<Booking> findByAgencyId(UUID agencyId);
    
    List<Booking> findByWorkerId(UUID workerId);
    
    List<Booking> findByStatus(BookingStatus status);

    
    @Query("SELECT b FROM Booking b WHERE b.worker.id = :workerId " +
           "AND b.status NOT IN :statuses " +
           "AND ((b.startTime < :endTime) AND (b.endTime > :startTime))")
    List<Booking> findOverlappingBookings(
            @Param("workerId") UUID workerId,
            @Param("startTime") OffsetDateTime startTime,
            @Param("endTime") OffsetDateTime endTime,
            @Param("statuses") List<BookingStatus> statuses
    );
    
    @Query("SELECT b FROM Booking b WHERE b.family.id = :familyId " +
           "AND b.status = :status " +
           "ORDER BY b.createdAt DESC")
    List<Booking> findByFamilyIdAndStatusOrderByCreatedAtDesc(
            @Param("familyId") UUID familyId,
            @Param("status") BookingStatus status
    );

    
    
}
