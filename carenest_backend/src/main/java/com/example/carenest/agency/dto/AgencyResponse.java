package com.example.carenest.agency.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class AgencyResponse {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String logoUrl;
    private String phone;
    private BigDecimal averageRating;
    private Integer totalReviews;
    private boolean acceptingBookings;
    private List<WorkerSummaryResponse> workers;
}
