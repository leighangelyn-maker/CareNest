package com.example.carenest.worker.controller;

import com.example.carenest.auth.model.User;
import com.example.carenest.auth.UserRepository;
import com.example.carenest.common.dto.response.ApiResponse;
import com.example.carenest.worker.dto.WorkerAvailabilityRequest;
import com.example.carenest.worker.dto.WorkerProfileRequest;
import com.example.carenest.worker.dto.WorkerProfileResponse;
import com.example.carenest.worker.service.WorkerService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/workers")
@RequiredArgsConstructor
@Tag(name = "Worker", description = "Worker profile management endpoints")
public class WorkerController {

    private final WorkerService workerService;
    private final UserRepository userRepository;  // ← ADD THIS

    @PostMapping("/profile")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Create a worker profile (Agency Admin only)")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> createWorkerProfile(
            @Valid @RequestBody WorkerProfileRequest request,
            Authentication authentication) {

        log.info("📥 Creating worker profile");

        try {
            // Get email from authentication
            String email = authentication.getName();
            log.info("Authenticated email: {}", email);

            // Find user by email
            User admin = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Admin not found with email: " + email));

            log.info("Admin found: {}, Role: {}, AgencyId: {}", 
                admin.getEmail(), admin.getRole(), admin.getAgencyId());

            UUID agencyId = admin.getAgencyId();

            if (agencyId == null) {
                log.error("❌ Admin has no agency ID!");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Agency admin must belong to an agency"));
            }

            WorkerProfileResponse response = workerService.createWorkerProfile(agencyId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Worker created successfully"));

        } catch (Exception e) {
            log.error("❌ Error creating worker: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create worker: " + e.getMessage()));
        }
    }

    @GetMapping("/profile/{workerId}")
    @Operation(summary = "Get worker profile by ID")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> getWorkerProfile(@PathVariable UUID workerId) {
        try {
            WorkerProfileResponse response = workerService.getWorkerProfile(workerId);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("❌ Error getting worker profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Worker not found"));
        }
    }

    @PutMapping("/profile/{workerId}")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Update worker profile (Agency Admin only)")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> updateWorkerProfile(
            @PathVariable UUID workerId,
            @Valid @RequestBody WorkerProfileRequest request,
            Authentication authentication) {

        log.info("📝 Updating worker profile: {}", workerId);

        try {
            // Verify admin belongs to same agency as worker
            String email = authentication.getName();
            User admin = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            // Optional: Verify admin's agency matches worker's agency
            // WorkerProfile existing = workerService.getWorkerProfile(workerId);
            // if (!existing.getAgencyId().equals(admin.getAgencyId())) {
            //     return ResponseEntity.status(HttpStatus.FORBIDDEN)
            //             .body(ApiResponse.error("You can only update workers in your agency"));
            // }

            WorkerProfileResponse response = workerService.updateWorkerProfile(workerId, request);
            return ResponseEntity.ok(ApiResponse.success(response, "Worker profile updated successfully"));

        } catch (Exception e) {
            log.error("❌ Error updating worker: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update worker: " + e.getMessage()));
        }
    }

    @PatchMapping("/profile/{workerId}/availability")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Update worker availability (Agency Admin only)")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> updateAvailability(
            @PathVariable UUID workerId,
            @Valid @RequestBody WorkerAvailabilityRequest request,
            Authentication authentication) {

        log.info("📅 Updating availability for worker: {}", workerId);

        try {
            WorkerProfileResponse response = workerService.updateAvailability(workerId, request);
            return ResponseEntity.ok(ApiResponse.success(response, "Worker availability updated successfully"));
        } catch (Exception e) {
            log.error("❌ Error updating availability: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update availability: " + e.getMessage()));
        }
    }

    @GetMapping("/agency/{agencyId}")
    @Operation(summary = "Get all workers for an agency")
    public ResponseEntity<ApiResponse<Page<WorkerProfileResponse>>> getWorkersByAgency(
            @PathVariable UUID agencyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "firstName") String sortBy) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
            Page<WorkerProfileResponse> responses = workerService.getWorkersByAgency(agencyId, pageable);
            return ResponseEntity.ok(ApiResponse.success(responses));
        } catch (Exception e) {
            log.error("❌ Error getting workers: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to get workers: " + e.getMessage()));
        }
    }

    @GetMapping("/agency/{agencyId}/available")
    @Operation(summary = "Get available workers for an agency (optionally filtered by service)")
    public ResponseEntity<ApiResponse<Page<WorkerProfileResponse>>> getAvailableWorkers(
            @PathVariable UUID agencyId,
            @RequestParam(required = false) String service,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("averageRating").descending());
            Page<WorkerProfileResponse> responses = workerService.getAvailableWorkersByAgencyAndService(agencyId, service, pageable);
            return ResponseEntity.ok(ApiResponse.success(responses));
        } catch (Exception e) {
            log.error("❌ Error getting available workers: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to get available workers: " + e.getMessage()));
        }
    }

    @DeleteMapping("/profile/{workerId}")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Delete worker profile (Agency Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteWorkerProfile(
            @PathVariable UUID workerId,
            Authentication authentication) {

        log.info("🗑️ Deleting worker profile: {}", workerId);

        try {
            workerService.deleteWorkerProfile(workerId);
            return ResponseEntity.ok(ApiResponse.success("Worker profile deleted successfully"));
        } catch (Exception e) {
            log.error("❌ Error deleting worker: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete worker: " + e.getMessage()));
        }
    }

    @PatchMapping("/profile/{workerId}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verify a worker (Admin only)")
    public ResponseEntity<ApiResponse<Void>> verifyWorker(@PathVariable UUID workerId) {
        try {
            workerService.verifyWorker(workerId);
            return ResponseEntity.ok(ApiResponse.success("Worker verified successfully"));
        } catch (Exception e) {
            log.error("❌ Error verifying worker: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to verify worker: " + e.getMessage()));
        }
    }

    @PatchMapping("/profile/{workerId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject a worker (Admin only)")
    public ResponseEntity<ApiResponse<Void>> rejectWorker(
            @PathVariable UUID workerId,
            @RequestParam(required = false) String reason) {

        try {
            workerService.rejectWorker(workerId, reason != null ? reason : "No reason provided");
            return ResponseEntity.ok(ApiResponse.success("Worker rejected"));
        } catch (Exception e) {
            log.error("❌ Error rejecting worker: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to reject worker: " + e.getMessage()));
        }
    }
}