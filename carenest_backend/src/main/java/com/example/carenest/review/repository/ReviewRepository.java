package com.example.carenest.review.repository;

import com.example.carenest.review.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    
    List<Review> findByAgencyId(UUID agencyId);
    
    Optional<Review> findByBookingId(UUID bookingId);
    
    List<Review> findByFamilyId(UUID familyId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.agency.id = :agencyId")
    Double averageRatingByAgencyId(@Param("agencyId") UUID agencyId);
}
