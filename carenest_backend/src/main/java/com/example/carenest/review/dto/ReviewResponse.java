package com.example.carenest.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private UUID id;
    private UUID bookingId;
    private UUID familyId;
    private UUID agencyId;
    private Integer rating;
    private String comment;
    private String reviewerName;
    private LocalDateTime createdAt;
}
