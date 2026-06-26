package com.example.carenest.worker.service;

import com.example.carenest.agency.model.Agency;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.worker.dto.WorkerAvailabilityRequest;
import com.example.carenest.worker.dto.WorkerProfileRequest;
import com.example.carenest.worker.dto.WorkerProfileResponse;
import com.example.carenest.worker.model.VerificationStatus;
import com.example.carenest.worker.model.WorkerProfile;
import com.example.carenest.worker.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkerServiceImpl implements WorkerService {

    private final WorkerProfileRepository workerProfileRepository;
    private final AgencyRepository agencyRepository;

    @Override
    @Transactional
    public WorkerProfileResponse createWorkerProfile(UUID agencyId, WorkerProfileRequest request) {
        log.info("Creating worker profile for agency: {}", agencyId);

        // Check if agency exists
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new RuntimeException("Agency not found with ID: " + agencyId));

        // Create worker profile (no User association)
        WorkerProfile workerProfile = WorkerProfile.builder()
                .agency(agency)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .photoUrl(request.getPhotoUrl())
                .bio(request.getBio())
                .yearsExperience(request.getYearsExperience())
                .hourlyRate(request.getHourlyRate())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .preferredLocation(request.getPreferredLocation())
                .services(request.getServices() != null ? request.getServices() : new ArrayList<>())
                .availableDays(request.getAvailableDays() != null ? request.getAvailableDays() : new ArrayList<>())
                .verificationStatus(VerificationStatus.PENDING)
                .isVerified(false)
                .averageRating(0.0)
                .totalReviews(0)
                .build();

        workerProfile = workerProfileRepository.save(workerProfile);
        log.info("Worker profile created successfully with id: {}", workerProfile.getId());

        return mapToResponse(workerProfile);
    }

    @Override
    public WorkerProfileResponse getWorkerProfile(UUID workerId) {
        WorkerProfile workerProfile = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker profile not found with ID: " + workerId));
        return mapToResponse(workerProfile);
    }

    @Override
    public WorkerProfileResponse getWorkerProfileByUser(UUID userId) {
        // Since workers no longer have User accounts, this method is deprecated
        throw new RuntimeException("Workers do not have user accounts. Use getWorkerProfile(workerId) instead.");
    }

    @Override
    @Transactional
    public WorkerProfileResponse updateWorkerProfile(UUID workerId, WorkerProfileRequest request) {
        log.info("Updating worker profile: {}", workerId);

        WorkerProfile workerProfile = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker profile not found with ID: " + workerId));

        // Update fields if present
        if (request.getFirstName() != null) workerProfile.setFirstName(request.getFirstName());
        if (request.getLastName() != null) workerProfile.setLastName(request.getLastName());
        if (request.getPhotoUrl() != null) workerProfile.setPhotoUrl(request.getPhotoUrl());
        if (request.getBio() != null) workerProfile.setBio(request.getBio());
        if (request.getYearsExperience() != null) workerProfile.setYearsExperience(request.getYearsExperience());
        if (request.getHourlyRate() != null) workerProfile.setHourlyRate(request.getHourlyRate());
        if (request.getIsAvailable() != null) workerProfile.setIsAvailable(request.getIsAvailable());
        if (request.getPreferredLocation() != null) workerProfile.setPreferredLocation(request.getPreferredLocation());
        if (request.getServices() != null) workerProfile.setServices(request.getServices());
        if (request.getAvailableDays() != null) workerProfile.setAvailableDays(request.getAvailableDays());

        workerProfile = workerProfileRepository.save(workerProfile);
        log.info("Worker profile updated successfully: {}", workerId);

        return mapToResponse(workerProfile);
    }

    @Override
    @Transactional
    public WorkerProfileResponse updateAvailability(UUID workerId, WorkerAvailabilityRequest request) {
        log.info("Updating availability for worker: {}", workerId);

        WorkerProfile workerProfile = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker profile not found with ID: " + workerId));

        if (request.getIsAvailable() != null) {
            workerProfile.setIsAvailable(request.getIsAvailable());
        }
        if (request.getAvailableDays() != null) {
            workerProfile.setAvailableDays(request.getAvailableDays());
        }

        workerProfile = workerProfileRepository.save(workerProfile);
        log.info("Availability updated for worker: {}", workerId);

        return mapToResponse(workerProfile);
    }

    @Override
    public Page<WorkerProfileResponse> getWorkersByAgency(UUID agencyId, Pageable pageable) {
        Page<WorkerProfile> workerProfiles = workerProfileRepository.findByAgencyId(agencyId, pageable);
        return workerProfiles.map(this::mapToResponse);
    }

    @Override
    public Page<WorkerProfileResponse> getAvailableWorkersByAgencyAndService(UUID agencyId, String service, Pageable pageable) {
        Page<WorkerProfile> workerProfiles = workerProfileRepository
                .findAvailableWorkersByAgencyAndService(agencyId, service, pageable);
        return workerProfiles.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void deleteWorkerProfile(UUID workerId) {
        log.info("Deleting worker profile: {}", workerId);

        WorkerProfile workerProfile = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker profile not found with ID: " + workerId));

        workerProfileRepository.delete(workerProfile);
        log.info("Worker profile deleted successfully: {}", workerId);
    }

    @Override
    @Transactional
    public void verifyWorker(UUID workerId) {
        log.info("Verifying worker: {}", workerId);

        WorkerProfile workerProfile = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker profile not found with ID: " + workerId));

        workerProfile.setVerificationStatus(VerificationStatus.VERIFIED);
        workerProfile.setIsVerified(true);
        workerProfileRepository.save(workerProfile);

        log.info("Worker verified successfully: {}", workerId);
    }

    @Override
    @Transactional
    public void rejectWorker(UUID workerId, String reason) {
        log.info("Rejecting worker: {} with reason: {}", workerId, reason);

        WorkerProfile workerProfile = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker profile not found with ID: " + workerId));

        workerProfile.setVerificationStatus(VerificationStatus.REJECTED);
        workerProfile.setIsVerified(false);
        workerProfileRepository.save(workerProfile);

        log.info("Worker rejected: {}", workerId);
    }

    private WorkerProfileResponse mapToResponse(WorkerProfile workerProfile) {
        Agency agency = workerProfile.getAgency();
        
        return WorkerProfileResponse.builder()
                .id(workerProfile.getId())
                .firstName(workerProfile.getFirstName())
                .lastName(workerProfile.getLastName())
                .photoUrl(workerProfile.getPhotoUrl())
                .bio(workerProfile.getBio())
                .yearsExperience(workerProfile.getYearsExperience())
                .hourlyRate(workerProfile.getHourlyRate())
                .isAvailable(workerProfile.getIsAvailable())
                .averageRating(workerProfile.getAverageRating())
                .totalReviews(workerProfile.getTotalReviews())
                .preferredLocation(workerProfile.getPreferredLocation())
                .services(workerProfile.getServices())
                .availableDays(workerProfile.getAvailableDays())
                .isVerified(workerProfile.getIsVerified())
                .verificationStatus(workerProfile.getVerificationStatus())
                .agencyName(agency != null ? agency.getName() : null)
                .agencyId(agency != null ? agency.getId() : null)
                .build();
    }
}