package com.example.carenest.review.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.carenest.review.Review;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Optional<Review> findByBooking_Id(UUID bookingId);

    List<Review> findByAgency_IdOrderByCreatedAtDesc(UUID agencyId);

    List<Review> findByFamily_IdOrderByCreatedAtDesc(UUID familyId);

    long countByAgency_Id(UUID agencyId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.agency.id = :agencyId")
    Double findAverageRatingForAgency(@Param("agencyId") UUID agencyId);
}