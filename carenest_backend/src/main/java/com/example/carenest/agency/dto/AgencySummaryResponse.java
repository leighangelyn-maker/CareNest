package com.example.carenest.agency.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class AgencySummaryResponse {
    private UUID id;
    private String name;
    private String slug;
    private String logoUrl;
    private BigDecimal averageRating;
    private Integer totalReviews;
    private String city;
}
