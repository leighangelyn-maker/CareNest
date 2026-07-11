package com.example.carenest.family.repository;

import com.example.carenest.family.FamilyAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FamilyAddressRepository extends JpaRepository<FamilyAddress, UUID> {

    List<FamilyAddress> findByFamilyId(UUID familyId);
}
