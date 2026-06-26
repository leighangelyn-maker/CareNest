package com.example.carenest.worker.service;

import com.example.carenest.worker.dto.WorkerAvailabilityRequest;
import com.example.carenest.worker.dto.WorkerProfileRequest;
import com.example.carenest.worker.dto.WorkerProfileResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WorkerService {

    WorkerProfileResponse createWorkerProfile(UUID agencyId, WorkerProfileRequest request);

    WorkerProfileResponse getWorkerProfile(UUID workerId);

    WorkerProfileResponse getWorkerProfileByUser(UUID userId);  // Deprecated

    WorkerProfileResponse updateWorkerProfile(UUID workerId, WorkerProfileRequest request);

    WorkerProfileResponse updateAvailability(UUID workerId, WorkerAvailabilityRequest request);

    Page<WorkerProfileResponse> getWorkersByAgency(UUID agencyId, Pageable pageable);

    Page<WorkerProfileResponse> getAvailableWorkersByAgencyAndService(UUID agencyId, String service, Pageable pageable);

    void deleteWorkerProfile(UUID workerId);

    void verifyWorker(UUID workerId);

    void rejectWorker(UUID workerId, String reason);
}