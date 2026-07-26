package com.example.carenest.review.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.example.carenest.review.Review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private UUID id;
    private UUID bookingId;
    private UUID familyId;
    private String familyName;
    private UUID agencyId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(review.getBooking().getId())
                .familyId(review.getFamily().getId())
                .familyName(review.getFamily().getFirstName() + " " + review.getFamily().getLastName())
                .agencyId(review.getAgency().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}