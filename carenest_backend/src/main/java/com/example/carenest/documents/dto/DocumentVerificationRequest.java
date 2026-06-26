package com.example.carenest.documents.dto;

import com.example.carenest.documents.model.DocumentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVerificationRequest {

    @NotNull(message = "Status is required")
    private DocumentStatus status;

    private String rejectionReason;
}