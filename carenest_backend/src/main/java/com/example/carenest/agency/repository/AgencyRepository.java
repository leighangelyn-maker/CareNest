package com.example.carenest.agency.repository;

import com.example.carenest.agency.Agency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgencyRepository extends JpaRepository<Agency, UUID> {
    Optional<Agency> findBySlug(String slug);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
