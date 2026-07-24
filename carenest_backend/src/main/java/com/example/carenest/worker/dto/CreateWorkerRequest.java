package com.example.carenest.worker.dto;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkerRequest {

    @NotNull(message = "Agency is required")
    private UUID agencyId;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @Email(message = "Email must be valid")
    private String email;

    @NotNull(message = "Service category is required")
    private UUID serviceCategoryId;

    @NotNull(message = "Default hourly rate is required")
    @Positive(message = "Default hourly rate must be positive")
    private Integer defaultHourlyRateMinorUnits;
}