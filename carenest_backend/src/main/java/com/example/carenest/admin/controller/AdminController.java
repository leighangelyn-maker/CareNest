package com.example.carenest.admin.controller;

import com.example.carenest.admin.dto.AgencyVerificationRequest;
import com.example.carenest.admin.dto.PlatformStatsResponse;
import com.example.carenest.admin.dto.UserStatusUpdateRequest;
import com.example.carenest.admin.service.AdminService;
import com.example.carenest.agency.Agency;
import com.example.carenest.auth.model.User;
import com.example.carenest.common.dto.response.ApiResponse;
import com.example.carenest.documents.model.VerificationDocument;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Administrative operations")
public class AdminController {

    private final AdminService adminService;

    // ==================== USER MANAGEMENT ====================

    @GetMapping("/users")
    @Operation(summary = "Get all users")
    public ResponseEntity<ApiResponse<Page<User>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<User> users = adminService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<User>> getUser(@PathVariable UUID userId) {
        User user = adminService.getUser(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PatchMapping("/users/{userId}/status")
    @Operation(summary = "Update user status (suspend/reactivate)")
    public ResponseEntity<ApiResponse<User>> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UserStatusUpdateRequest request) {

        User user = adminService.updateUserStatus(userId, request);
        String message = request.getStatus().name().equals("ACTIVE") 
                ? "User activated successfully" 
                : "User suspended successfully";
        return ResponseEntity.ok(ApiResponse.success(user, message));
    }

    // ==================== AGENCY MANAGEMENT ====================

    @GetMapping("/agencies")
    @Operation(summary = "Get all agencies")
    public ResponseEntity<ApiResponse<Page<Agency>>> getAllAgencies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        Page<Agency> agencies = adminService.getAllAgencies(pageable);
        return ResponseEntity.ok(ApiResponse.success(agencies));
    }

    @GetMapping("/agencies/{agencyId}")
    @Operation(summary = "Get agency by ID")
    public ResponseEntity<ApiResponse<Agency>> getAgency(@PathVariable UUID agencyId) {
        Agency agency = adminService.getAgency(agencyId);
        return ResponseEntity.ok(ApiResponse.success(agency));
    }

    @PatchMapping("/agencies/{agencyId}/verify")
    @Operation(summary = "Verify or reject an agency")
    public ResponseEntity<ApiResponse<Agency>> verifyAgency(
            @PathVariable UUID agencyId,
            @Valid @RequestBody AgencyVerificationRequest request) {

        Agency agency = adminService.verifyAgency(agencyId, request);
        String message = request.getVerificationStatus().name().equals("VERIFIED") 
                ? "Agency verified successfully" 
                : "Agency rejected";
        return ResponseEntity.ok(ApiResponse.success(agency, message));
    }

    @PatchMapping("/agencies/{agencyId}/suspend")
    @Operation(summary = "Suspend an agency")
    public ResponseEntity<ApiResponse<Agency>> suspendAgency(
            @PathVariable UUID agencyId,
            @RequestParam(required = false) String reason) {

        Agency agency = adminService.suspendAgency(agencyId, reason != null ? reason : "No reason provided");
        return ResponseEntity.ok(ApiResponse.success(agency, "Agency suspended successfully"));
    }

    // ==================== DOCUMENT MANAGEMENT ====================

    @GetMapping("/documents/pending")
    @Operation(summary = "Get all pending documents for verification")
    public ResponseEntity<ApiResponse<Page<VerificationDocument>>> getPendingDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<VerificationDocument> documents = adminService.getPendingDocuments(pageable);
        return ResponseEntity.ok(ApiResponse.success(documents));
    }

    @PatchMapping("/documents/{documentId}/verify")
    @Operation(summary = "Verify or reject a document")
    public ResponseEntity<ApiResponse<VerificationDocument>> verifyDocument(
            @PathVariable UUID documentId,
            @RequestParam String status,
            @RequestParam(required = false) String rejectionReason,
            Authentication authentication) {

        // You can fetch the admin user to get their ID
        // For now, using a dummy UUID - you should get the actual admin ID

        VerificationDocument document = adminService.verifyDocument(
                documentId, 
                status, 
                rejectionReason, 
                UUID.randomUUID() // Replace with actual admin ID
        );

        String message = status.equals("VERIFIED") 
                ? "Document verified successfully" 
                : "Document rejected";
        return ResponseEntity.ok(ApiResponse.success(document, message));
    }

    // ==================== STATISTICS ====================

    @GetMapping("/stats")
    @Operation(summary = "Get platform statistics")
    public ResponseEntity<ApiResponse<PlatformStatsResponse>> getPlatformStats() {
        PlatformStatsResponse stats = adminService.getPlatformStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}