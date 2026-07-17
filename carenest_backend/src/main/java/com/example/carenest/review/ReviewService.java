package com.example.carenest.review;

import com.example.carenest.agency.Agency;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.booking.Booking;
import com.example.carenest.booking.BookingStatus;
import com.example.carenest.booking.repository.BookingRepository;
import com.example.carenest.family.FamilyProfile;
import com.example.carenest.family.repository.FamilyProfileRepository;
import com.example.carenest.review.dto.ReviewRequest;
import com.example.carenest.review.dto.ReviewResponse;
import com.example.carenest.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final AgencyRepository agencyRepository;
    private final FamilyProfileRepository familyProfileRepository;

    @Transactional
    public ReviewResponse submitReview(UUID familyId, ReviewRequest request) {
        log.info("Submitting review for booking: {}", request.getBookingId());

        // Validate booking exists and is completed
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Can only review completed bookings");
        }

        // Validate family owns the booking
        if (!booking.getFamily().getId().equals(familyId)) {
            throw new RuntimeException("You can only review your own bookings");
        }

        // Check if review already exists
        reviewRepository.findByBookingId(request.getBookingId()).ifPresent(review -> {
            throw new RuntimeException("Review already exists for this booking");
        });

        // Get family profile
        FamilyProfile family = familyProfileRepository.findById(familyId)
                .orElseThrow(() -> new RuntimeException("Family not found"));

        // Create review
        Review review = Review.builder()
                .booking(booking)
                .family(family)
                .agency(booking.getAgency())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);

        // Update agency rating
        updateAgencyRating(booking.getAgency());

        log.info("Review submitted successfully: {}", savedReview.getId());

        return mapToResponse(savedReview);
    }

    public List<ReviewResponse> getAgencyReviews(UUID agencyId) {
        log.info("Fetching reviews for agency: {}", agencyId);
        return reviewRepository.findByAgencyId(agencyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ReviewResponse> getFamilyReviews(UUID familyId) {
        log.info("Fetching reviews for family: {}", familyId);
        return reviewRepository.findByFamilyId(familyId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(review.getBooking() != null ? review.getBooking().getId() : null)
                .familyId(review.getFamily() != null ? review.getFamily().getId() : null)
                .agencyId(review.getAgency() != null ? review.getAgency().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .reviewerName(review.getFamily() != null ? 
                        review.getFamily().getFirstName() + " " + review.getFamily().getLastName() : "Anonymous")
                .createdAt(review.getCreatedAt())
                .build();
    }

    private void updateAgencyRating(Agency agency) {
        Double avgRating = reviewRepository.averageRatingByAgencyId(agency.getId());
        Integer totalReviews = reviewRepository.findByAgencyId(agency.getId()).size();

        if (avgRating != null) {
            agency.setAverageRating(BigDecimal.valueOf(avgRating));
        }
        agency.setTotalReviews(totalReviews);

        agencyRepository.save(agency);
        log.info("Updated agency rating: {} - {} ({} reviews)", agency.getId(), avgRating, totalReviews);
    }
}
