package com.example.carenest.agency;

import com.example.carenest.agency.dto.*;
import com.example.carenest.agency.repository.AgencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AgencyService {

    private final AgencyRepository agencyRepository;

    public List<AgencySummaryResponse> searchAgencies(String category, String city, Double minRating) {
        // Implementation with filters (you can use Specifications or @Query later)
        return agencyRepository.findAll().stream()
                .map(this::mapToSummary)
                .toList();
    }

    public AgencyResponse getAgencyProfile(UUID id) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agency not found"));
        return mapToResponse(agency);
    }

    private AgencySummaryResponse mapToSummary(Agency agency) {
        AgencySummaryResponse response = new AgencySummaryResponse();
        response.setId(agency.getId());
        response.setName(agency.getName());
        response.setSlug(agency.getSlug());
        response.setLogoUrl(agency.getLogoUrl());
        response.setAverageRating(agency.getAverageRating());
        response.setTotalReviews(agency.getTotalReviews());
        return response;
    }

    private AgencyResponse mapToResponse(Agency agency) {
        AgencyResponse response = new AgencyResponse();
        response.setId(agency.getId());
        response.setName(agency.getName());
        response.setSlug(agency.getSlug());
        response.setDescription(agency.getDescription());
        response.setLogoUrl(agency.getLogoUrl());
        response.setPhone(agency.getPhone());
        response.setAverageRating(agency.getAverageRating());
        response.setTotalReviews(agency.getTotalReviews());
        response.setAcceptingBookings(agency.isAcceptingBookings());
        return response;
    }
}