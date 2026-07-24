package com.example.carenest.worker;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.agency.Agency;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.common.ServiceCategory;
import com.example.carenest.common.ServiceCategoryRepository;
import com.example.carenest.common.exception.ResourceNotFoundException;
import com.example.carenest.worker.dto.CreateWorkerRequest;
import com.example.carenest.worker.dto.WorkerResponse;
import com.example.carenest.worker.repository.WorkerRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkerServiceImpl implements WorkerService {

    private final WorkerRepository workerRepository;
    private final AgencyRepository agencyRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;

    @Override
    @Transactional
    public WorkerResponse createWorker(CreateWorkerRequest request) {
        Agency agency = agencyRepository.findById(request.getAgencyId())
                .orElseThrow(() -> new ResourceNotFoundException("Agency not found: " + request.getAgencyId()));

        ServiceCategory serviceCategory = serviceCategoryRepository.findById(request.getServiceCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Service category not found: " + request.getServiceCategoryId()));

        Worker worker = Worker.builder()
                .agency(agency)
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .serviceCategory(serviceCategory)
                .defaultHourlyRateMinorUnits(request.getDefaultHourlyRateMinorUnits())
                .status(WorkerStatus.ACTIVE)
                .build();

        Worker saved = workerRepository.save(worker);
        log.info("Worker {} created for agency {}", saved.getId(), agency.getId());
        return WorkerResponse.fromEntity(saved);
    }

    @Override
    public WorkerResponse getWorkerById(UUID workerId) {
        return WorkerResponse.fromEntity(findWorkerOrThrow(workerId));
    }

    @Override
    public List<WorkerResponse> getWorkersForAgency(UUID agencyId) {
        return workerRepository.findByAgency_Id(agencyId).stream()
                .map(WorkerResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public WorkerResponse updateStatus(UUID workerId, WorkerStatus status) {
        Worker worker = findWorkerOrThrow(workerId);
        worker.setStatus(status);
        Worker saved = workerRepository.save(worker);
        log.info("Worker {} status updated to {}", workerId, status);
        return WorkerResponse.fromEntity(saved);
    }

    @Override
    public List<WorkerResponse> searchWorkers(UUID serviceCategoryId, String city, String region) {
        // Default to ACTIVE only - a family searching for help shouldn't see
        // inactive/on-leave workers as options.
        return workerRepository.searchWorkers(WorkerStatus.ACTIVE, serviceCategoryId, city, region).stream()
                .map(WorkerResponse::fromEntity)
                .toList();
    }

    private Worker findWorkerOrThrow(UUID workerId) {
        return workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found: " + workerId));
    }
}