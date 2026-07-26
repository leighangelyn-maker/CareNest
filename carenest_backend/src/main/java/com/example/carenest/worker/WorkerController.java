package com.example.carenest.worker;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.common.dto.response.ApiResponse;
import com.example.carenest.worker.dto.CreateWorkerRequest;
import com.example.carenest.worker.dto.WorkerResponse;

@Slf4j
@RestController
@RequestMapping("/workers")
@RequiredArgsConstructor
public class WorkerController {

    private final WorkerService workerService;

    @PostMapping
    public ResponseEntity<ApiResponse<WorkerResponse>> createWorker(
            @Valid @RequestBody CreateWorkerRequest request) {
        WorkerResponse response = workerService.createWorker(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Worker created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkerResponse>> getWorker(@PathVariable UUID id) {
        WorkerResponse response = workerService.getWorkerById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Worker retrieved successfully"));
    }

    @GetMapping("/agency/{agencyId}")
    public ResponseEntity<ApiResponse<List<WorkerResponse>>> getWorkersForAgency(
            @PathVariable UUID agencyId) {
        List<WorkerResponse> response = workerService.getWorkersForAgency(agencyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Workers retrieved successfully"));
    }

    /**
     * Worker Search API. All filters optional - e.g.
     * GET /workers/search?serviceCategoryId=...&city=Kumasi
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<WorkerResponse>>> searchWorkers(
            @RequestParam(required = false) UUID serviceCategoryId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String region) {
        List<WorkerResponse> response = workerService.searchWorkers(serviceCategoryId, city, region);
        return ResponseEntity.ok(ApiResponse.success(response, "Workers retrieved successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<WorkerResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam WorkerStatus status) {
        WorkerResponse response = workerService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Worker status updated successfully"));
    }
}