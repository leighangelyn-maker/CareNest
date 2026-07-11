package com.example.carenest.family.repository;

import com.example.carenest.family.FamilyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FamilyProfileRepository extends JpaRepository<FamilyProfile, UUID> {

    Optional<FamilyProfile> findByUserId(UUID userId);
}
