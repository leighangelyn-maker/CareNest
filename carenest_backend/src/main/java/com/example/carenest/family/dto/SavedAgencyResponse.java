package com.example.carenest.family.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.example.carenest.family.SavedAgency;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedAgencyResponse {

    private UUID id;
    private UUID agencyId;
    private String agencyName;
    private String agencyCity;
    private String agencyRegion;
    private java.math.BigDecimal agencyAverageRating;
    private LocalDateTime savedAt;

    public static SavedAgencyResponse fromEntity(SavedAgency savedAgency) {
        return SavedAgencyResponse.builder()
                .id(savedAgency.getId())
                .agencyId(savedAgency.getAgency().getId())
                .agencyName(savedAgency.getAgency().getName())
                .agencyCity(savedAgency.getAgency().getCity())
                .agencyRegion(savedAgency.getAgency().getRegion())
                .agencyAverageRating(savedAgency.getAgency().getAverageRating())
                .savedAt(savedAgency.getCreatedAt())
                .build();
    }
}