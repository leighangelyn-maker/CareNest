package com.example.carenest.admin.dto;

import com.example.carenest.agency.model.VerificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyVerificationRequest {

    @NotNull(message = "Verification status is required")
    private VerificationStatus verificationStatus;

    private String reason;
}