package com.example.carenest.agency.repository;

import com.example.carenest.agency.AgencyPayout;
import com.example.carenest.agency.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgencyPayoutRepository extends JpaRepository<AgencyPayout, UUID> {

    List<AgencyPayout> findByAgencyId(UUID agencyId);

    List<AgencyPayout> findByAgencyIdAndStatus(UUID agencyId, PayoutStatus status);

    long countByStatus(PayoutStatus status);
}