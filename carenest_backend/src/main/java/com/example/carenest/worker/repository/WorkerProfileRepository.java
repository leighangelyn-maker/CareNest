package com.example.carenest.worker.repository;

import com.example.carenest.worker.VerificationStatus;
import com.example.carenest.worker.WorkerProfile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, UUID> {

    // Remove this - no longer exists
    // Optional<WorkerProfile> findByUserId(UUID userId);

    List<WorkerProfile> findByAgencyId(UUID agencyId);

    Page<WorkerProfile> findByAgencyId(UUID agencyId, Pageable pageable);

    Page<WorkerProfile> findByAgencyIdAndIsAvailableTrue(UUID agencyId, Pageable pageable);

    Page<WorkerProfile> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    @Query("SELECT w FROM WorkerProfile w WHERE w.agency.id = :agencyId AND " +
           "(:service IS NULL OR :service MEMBER OF w.services) AND " +
           "(w.isAvailable = true) AND " +
           "(w.verificationStatus = 'VERIFIED')")
    Page<WorkerProfile> findAvailableWorkersByAgencyAndService(
            @Param("agencyId") UUID agencyId,
            @Param("service") String service,
            Pageable pageable);

    @Query("SELECT AVG(w.averageRating) FROM WorkerProfile w WHERE w.agency.id = :agencyId")
    Double getAverageRatingForAgency(@Param("agencyId") UUID agencyId);

    long countByAgencyIdAndVerificationStatus(UUID agencyId, VerificationStatus status);
}