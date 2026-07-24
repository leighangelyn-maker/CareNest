package com.example.carenest.worker;

import java.util.List;
import java.util.UUID;

import com.example.carenest.worker.dto.CreateWorkerRequest;
import com.example.carenest.worker.dto.WorkerResponse;

public interface WorkerService {

    WorkerResponse createWorker(CreateWorkerRequest request);

    WorkerResponse getWorkerById(UUID workerId);

    List<WorkerResponse> getWorkersForAgency(UUID agencyId);

    WorkerResponse updateStatus(UUID workerId, WorkerStatus status);

    /**
     * @param serviceCategoryId nullable - omit to search across all categories
     * @param city              nullable - omit to search all cities
     * @param region            nullable - omit to search all regions
     */
    List<WorkerResponse> searchWorkers(UUID serviceCategoryId, String city, String region);
}