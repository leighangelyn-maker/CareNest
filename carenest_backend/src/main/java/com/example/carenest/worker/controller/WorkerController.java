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
        
        // Get the email from authentication
        String email = authentication.getName();
        log.info("👤 Authenticated user email: {}", email);

        // Find the user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        
        log.info("👤 User: {}, Role: {}, AgencyId: {}", 
            user.getEmail(), user.getRole(), user.getAgencyId());

        UUID agencyId = user.getAgencyId();

        if (agencyId == null) {
            log.error("❌ User has no agency ID!");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Agency admin must belong to an agency"));
        }

        WorkerProfileResponse response = workerService.createWorkerProfile(user.getId(), agencyId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Worker profile created successfully"));
    }

    @GetMapping("/profile/{workerId}")
    @Operation(summary = "Get worker profile by ID")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> getWorkerProfile(@PathVariable UUID workerId) {
        WorkerProfileResponse response = workerService.getWorkerProfile(workerId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('WORKER')")
    @Operation(summary = "Get authenticated worker's profile")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> getMyWorkerProfile(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        
        WorkerProfileResponse response = workerService.getWorkerProfileByUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/profile/{workerId}")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Update worker profile (Agency Admin only)")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> updateWorkerProfile(
            @PathVariable UUID workerId,
            @Valid @RequestBody WorkerProfileRequest request,
            Authentication authentication) {

        // Verify the user is an agency admin for this worker's agency
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        
        // You might want to add additional validation here to ensure the admin belongs to the same agency

        WorkerProfileResponse response = workerService.updateWorkerProfile(workerId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Worker profile updated successfully"));
    }

    @PatchMapping("/profile/{workerId}/availability")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Update worker availability (Agency Admin only)")
    public ResponseEntity<ApiResponse<WorkerProfileResponse>> updateAvailability(
            @PathVariable UUID workerId,
            @Valid @RequestBody WorkerAvailabilityRequest request,
            Authentication authentication) {

        WorkerProfileResponse response = workerService.updateAvailability(workerId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Worker availability updated successfully"));
    }

    @GetMapping("/agency/{agencyId}")
    @Operation(summary = "Get all workers for an agency")
    public ResponseEntity<ApiResponse<Page<WorkerProfileResponse>>> getWorkersByAgency(
            @PathVariable UUID agencyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "firstName") String sortBy) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<WorkerProfileResponse> responses = workerService.getWorkersByAgency(agencyId, pageable);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/agency/{agencyId}/available")
    @Operation(summary = "Get available workers for an agency (optionally filtered by service)")
    public ResponseEntity<ApiResponse<Page<WorkerProfileResponse>>> getAvailableWorkers(
            @PathVariable UUID agencyId,
            @RequestParam(required = false) String service,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("averageRating").descending());
        Page<WorkerProfileResponse> responses = workerService.getAvailableWorkersByAgencyAndService(agencyId, service, pageable);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/profile/{workerId}")
    @PreAuthorize("hasRole('AGENCY_ADMIN')")
    @Operation(summary = "Delete worker profile (Agency Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteWorkerProfile(
            @PathVariable UUID workerId,
            Authentication authentication) {

        workerService.deleteWorkerProfile(workerId);
        return ResponseEntity.ok(ApiResponse.success("Worker profile deleted successfully"));
    }

    @PatchMapping("/profile/{workerId}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verify a worker (Admin only)")
    public ResponseEntity<ApiResponse<Void>> verifyWorker(@PathVariable UUID workerId) {
        workerService.verifyWorker(workerId);
        return ResponseEntity.ok(ApiResponse.success("Worker verified successfully"));
    }

    @PatchMapping("/profile/{workerId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject a worker (Admin only)")
    public ResponseEntity<ApiResponse<Void>> rejectWorker(
            @PathVariable UUID workerId,
            @RequestParam(required = false) String reason) {

        workerService.rejectWorker(workerId, reason != null ? reason : "No reason provided");
        return ResponseEntity.ok(ApiResponse.success("Worker rejected"));
    }
}