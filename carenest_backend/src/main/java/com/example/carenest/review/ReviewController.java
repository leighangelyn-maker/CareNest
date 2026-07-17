package com.example.carenest.review;

import com.example.carenest.common.dto.response.ApiResponse;
import com.example.carenest.review.dto.ReviewRequest;
import com.example.carenest.review.dto.ReviewResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Review management APIs")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @Operation(summary = "Submit a review for a completed booking")
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
            @RequestParam UUID familyId,
            @Valid @RequestBody ReviewRequest request) {
        log.info("Submitting review for family: {}", familyId);
        ReviewResponse response = reviewService.submitReview(familyId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Review submitted successfully"));
    }

    @GetMapping("/agency/{agencyId}")
    @Operation(summary = "Get all reviews for an agency")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getAgencyReviews(
            @PathVariable UUID agencyId) {
        log.info("Fetching reviews for agency: {}", agencyId);
        List<ReviewResponse> responses = reviewService.getAgencyReviews(agencyId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/family/{familyId}")
    @Operation(summary = "Get all reviews by a family")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getFamilyReviews(
            @PathVariable UUID familyId) {
        log.info("Fetching reviews for family: {}", familyId);
        List<ReviewResponse> responses = reviewService.getFamilyReviews(familyId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
