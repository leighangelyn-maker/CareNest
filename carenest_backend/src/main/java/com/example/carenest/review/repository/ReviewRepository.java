package com.example.carenest.review.repository;

//importing the Review entity
import com.example.carenest.review.Review;
//importing the JpaRepository interface
import org.springframework.data.jpa.repository.JpaRepository;
//importing the Repository annotation
import org.springframework.stereotype.Repository;

//importing the List and UUID classes
import java.util.List;
import java.util.UUID;

// Repository interface for Review entity
@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByAgencyId(UUID agencyId);
}
