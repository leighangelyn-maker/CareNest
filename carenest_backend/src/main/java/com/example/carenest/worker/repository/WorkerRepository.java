package com.example.carenest.worker.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.carenest.worker.Worker;
import com.example.carenest.worker.WorkerStatus;

public interface WorkerRepository extends JpaRepository<Worker, UUID> {

    List<Worker> findByAgency_Id(UUID agencyId);

    /**
     * Worker Search API: filters are optional (pass null to skip a
     * condition). city/region match is case-insensitive against the
     * worker's agency, since Worker itself carries no location.
     */
    @Query("""
        SELECT w FROM Worker w
        WHERE w.status = :status
        AND (:serviceCategoryId IS NULL OR w.serviceCategory.id = :serviceCategoryId)
        AND (:city IS NULL OR LOWER(w.agency.city) = LOWER(:city))
        AND (:region IS NULL OR LOWER(w.agency.region) = LOWER(:region))
        """)
    List<Worker> searchWorkers(
            @Param("status") WorkerStatus status,
            @Param("serviceCategoryId") UUID serviceCategoryId,
            @Param("city") String city,
            @Param("region") String region
    );
}