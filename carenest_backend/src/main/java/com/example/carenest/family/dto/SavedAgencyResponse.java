package com.example.carenest.family.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class SavedAgencyResponse {
    private UUID agencyId;
    private String agencyName;
    private String slug;
    private String logoUrl;
    private double averageRating;
}
