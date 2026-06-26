package com.example.carenest.worker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerProfileRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String photoUrl;

    private String bio;

    @Positive(message = "Years experience cannot be negative")
    private Integer yearsExperience;

    @Positive(message = "Hourly rate must be greater than 0")
    private Double hourlyRate;

    private Boolean isAvailable;

    private String preferredLocation;

    private List<String> services;

    private List<String> availableDays;
}