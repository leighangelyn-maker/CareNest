package com.example.carenest.documents.dto;

import com.example.carenest.documents.model.DocumentType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadRequest {

    @NotNull(message = "File is required")
    private MultipartFile file;

    @NotNull(message = "Document type is required")
    private DocumentType documentType;

    private String description;
}