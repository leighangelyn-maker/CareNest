package com.example.carenest.documents.dto;

import com.example.carenest.documents.model.DocumentStatus;
import com.example.carenest.documents.model.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {

    private UUID id;
    private UUID workerId;           // ← Changed from userId
    private String workerFirstName;  // ← Added
    private String workerLastName;   // ← Added
    private DocumentType documentType;
    private String documentName;
    private String fileUrl;
    private Long fileSize;
    private String fileType;
    private String description;
    private DocumentStatus status;
    private String rejectionReason;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}