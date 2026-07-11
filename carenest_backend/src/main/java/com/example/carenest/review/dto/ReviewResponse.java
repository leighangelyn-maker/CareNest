package com.example.carenest.review.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ReviewResponse {
    private UUID id;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
    private String reviewerName;
}
