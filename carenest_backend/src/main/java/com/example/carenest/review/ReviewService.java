package com.example.carenest.review;

import com.example.carenest.review.dto.ReviewRequest;
import com.example.carenest.review.dto.ReviewResponse;
import com.example.carenest.review.repository.ReviewRepository;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.booking.repository.BookingRepository;
import com.example.carenest.agency.Agency;
import com.example.carenest.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final AgencyRepository agencyRepository;
    private final SecurityUtils securityUtils;

    @Transactional
    public ReviewResponse submitReview(ReviewRequest request) {
        // Validate booking is completed and belongs to current user
        // Create review
        // Update agency average rating
        // Return response
        return new ReviewResponse();
    }

    public List<ReviewResponse> getAgencyReviews(UUID agencyId) {
        return reviewRepository.findByAgencyId(agencyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private ReviewResponse mapToResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setRating(review.getRating());
        response.setComment(review.getComment());
        response.setCreatedAt(review.getCreatedAt());
        return response;
    }

    // Helper method to update agency rating
    private void updateAgencyRating(Agency agency) {
        // Recalculate average from all reviews
        // agency.setAverageRating(...);
        // agency.setTotalReviews(...);
        agencyRepository.save(agency);
    }
}
