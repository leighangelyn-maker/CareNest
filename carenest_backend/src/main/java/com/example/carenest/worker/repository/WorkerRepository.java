package com.example.carenest.worker.repository;

import com.example.carenest.worker.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, UUID> {
    List<Worker> findByAgencyId(UUID agencyId);
}
