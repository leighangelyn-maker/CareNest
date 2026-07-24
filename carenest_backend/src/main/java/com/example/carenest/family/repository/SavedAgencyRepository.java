package com.example.carenest.family.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carenest.family.SavedAgency;

public interface SavedAgencyRepository extends JpaRepository<SavedAgency, UUID> {

    List<SavedAgency> findByFamily_IdOrderByCreatedAtDesc(UUID familyId);

    Optional<SavedAgency> findByFamily_IdAndAgency_Id(UUID familyId, UUID agencyId);

    boolean existsByFamily_IdAndAgency_Id(UUID familyId, UUID agencyId);
}