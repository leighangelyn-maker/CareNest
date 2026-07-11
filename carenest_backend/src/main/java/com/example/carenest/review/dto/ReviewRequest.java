package com.example.carenest.review.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ReviewRequest {
    private UUID bookingId;
    private int rating; // 1-5
    private String comment;
}
