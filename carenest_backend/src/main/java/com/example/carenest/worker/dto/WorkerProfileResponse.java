package com.example.carenest.worker.dto;

import com.example.carenest.worker.model.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerProfileResponse {

    private UUID id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private String photoUrl;
    private String bio;
    private Integer yearsExperience;
    private Double hourlyRate;
    private Boolean isAvailable;
    private Double averageRating;
    private Integer totalReviews;
    private String preferredLocation;
    private List<String> services;
    private List<String> availableDays;
    private Boolean isVerified;
    private VerificationStatus verificationStatus;
    private String agencyName;
    private UUID agencyId;
}