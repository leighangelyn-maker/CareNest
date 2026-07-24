package com.example.carenest.review;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.agency.Agency;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.booking.Booking;
import com.example.carenest.booking.BookingStatus;
import com.example.carenest.booking.repository.BookingRepository;
import com.example.carenest.common.exception.BadRequestException;
import com.example.carenest.common.exception.ResourceNotFoundException;
import com.example.carenest.family.FamilyProfile;
import com.example.carenest.notification.NotificationService;
import com.example.carenest.notification.NotificationType;
import com.example.carenest.review.dto.ReviewRequest;
import com.example.carenest.review.dto.ReviewResponse;
import com.example.carenest.review.repository.ReviewRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final AgencyRepository agencyRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ReviewResponse submitReview(UUID familyId, ReviewRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.getBookingId()));

        if (!booking.getFamily().getId().equals(familyId)) {
            throw new BadRequestException("You can only review your own bookings");
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("You can only review a booking after it's marked COMPLETED");
        }

        reviewRepository.findByBooking_Id(booking.getId()).ifPresent(existing -> {
            throw new BadRequestException("This booking has already been reviewed");
        });

        FamilyProfile family = booking.getFamily();
        Agency agency = booking.getAgency();

        Review review = Review.builder()
                .booking(booking)
                .family(family)
                .agency(agency)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Review {} created for booking {} ({} stars)", saved.getId(), booking.getId(), saved.getRating());

        recalculateAgencyRatingStats(agency);

        notificationService.create(
                agency.getUser(),
                NotificationType.NEW_REVIEW,
                "New review received",
                "Your agency received a " + request.getRating() + "-star review.",
                booking.getId());

        return ReviewResponse.fromEntity(saved);
    }

    @Override
    public List<ReviewResponse> getAgencyReviews(UUID agencyId) {
        return reviewRepository.findByAgency_IdOrderByCreatedAtDesc(agencyId).stream()
                .map(ReviewResponse::fromEntity)
                .toList();
    }

    @Override
    public List<ReviewResponse> getFamilyReviews(UUID familyId) {
        return reviewRepository.findByFamily_IdOrderByCreatedAtDesc(familyId).stream()
                .map(ReviewResponse::fromEntity)
                .toList();
    }

    private void recalculateAgencyRatingStats(Agency agency) {
        long totalReviews = reviewRepository.countByAgency_Id(agency.getId());
        Double rawAverage = reviewRepository.findAverageRatingForAgency(agency.getId());

        BigDecimal average = rawAverage != null
                ? BigDecimal.valueOf(rawAverage).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        agency.setAverageRating(average);
        agency.setTotalReviews((int) totalReviews);
        agencyRepository.save(agency);
    }
}