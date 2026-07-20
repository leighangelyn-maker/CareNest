package com.example.carenest.documents.controller;

import com.example.carenest.auth.model.User;
import com.example.carenest.auth.UserRepository;
import com.example.carenest.common.dto.response.ApiResponse;
import com.example.carenest.documents.dto.DocumentResponse;
import com.example.carenest.documents.dto.DocumentVerificationRequest;
import com.example.carenest.documents.model.DocumentType;
import com.example.carenest.documents.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Document verification endpoints")
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Upload a verification document for an agency (Agency Admin only)")
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") DocumentType documentType,
            @RequestParam("agencyId") UUID agencyId,
            @RequestParam(value = "description", required = false) String description,
            Authentication authentication) {

        log.info("📤 Uploading document for agency: {}", agencyId);

        User admin = getUserFromAuthentication(authentication);

        DocumentResponse response = documentService.uploadDocument(
                agencyId, file, documentType, description
        );
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Document uploaded successfully"));
    }

    @GetMapping("/agency/{agencyId}")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Get all documents for an agency (Agency Admin only)")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getAgencyDocuments(
            @PathVariable UUID agencyId,
            Authentication authentication) {

        List<DocumentResponse> responses = documentService.getAgencyDocuments(agencyId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{documentId}")
    @Operation(summary = "Get a specific document by ID")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocument(@PathVariable UUID documentId) {
        DocumentResponse response = documentService.getDocument(documentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all pending documents for verification (Admin only)")
    public ResponseEntity<ApiResponse<Page<DocumentResponse>>> getPendingDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<DocumentResponse> responses = documentService.getPendingDocuments(pageable);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PatchMapping("/{documentId}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verify or reject a document (Admin only)")
    public ResponseEntity<ApiResponse<DocumentResponse>> verifyDocument(
            @PathVariable UUID documentId,
            @Valid @RequestBody DocumentVerificationRequest request,
            Authentication authentication) {

        User admin = getUserFromAuthentication(authentication);
        
        DocumentResponse response = documentService.verifyDocument(documentId, request, admin.getId());
        
        String message = request.getStatus().name().equals("VERIFIED") 
                ? "Document verified successfully" 
                : "Document rejected";
        
        return ResponseEntity.ok(ApiResponse.success(response, message));
    }

    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Delete a document (Agency Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable UUID documentId,
            Authentication authentication) {

        documentService.deleteDocument(documentId);
        return ResponseEntity.ok(ApiResponse.success("Document deleted successfully"));
    }

    @GetMapping("/check/{agencyId}/{documentType}")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Check if an agency has uploaded a specific document type")
    public ResponseEntity<ApiResponse<Boolean>> checkDocumentExists(
            @PathVariable UUID agencyId,
            @PathVariable DocumentType documentType,
            Authentication authentication) {

        boolean exists = documentService.hasAgencyUploadedDocumentType(agencyId, documentType);
        return ResponseEntity.ok(ApiResponse.success(exists));
    }

    private User getUserFromAuthentication(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}