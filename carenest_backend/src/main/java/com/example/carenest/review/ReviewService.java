package com.example.carenest.review;

import java.util.List;
import java.util.UUID;

import com.example.carenest.review.dto.ReviewRequest;
import com.example.carenest.review.dto.ReviewResponse;

public interface ReviewService {

    ReviewResponse submitReview(UUID familyId, ReviewRequest request);

    List<ReviewResponse> getAgencyReviews(UUID agencyId);

    List<ReviewResponse> getFamilyReviews(UUID familyId);
}