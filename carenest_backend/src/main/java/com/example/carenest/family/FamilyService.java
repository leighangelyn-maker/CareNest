package com.example.carenest.family;

import com.example.carenest.family.dto.*;
import com.example.carenest.family.repository.FamilyProfileRepository;
import com.example.carenest.family.repository.FamilyAddressRepository;
import com.example.carenest.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyProfileRepository familyProfileRepository;
    private final FamilyAddressRepository familyAddressRepository;
    private final SecurityUtils securityUtils; // Assume you have this from BE1

    public FamilyProfileResponse getCurrentFamilyProfile() {
        UUID userId = securityUtils.getCurrentUserId();
        FamilyProfile profile = familyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return mapToResponse(profile);
    }

    @Transactional
    public FamilyProfileResponse updateProfile(FamilyProfileUpdateRequest request) {
        // implementation...
        return null; // placeholder
    }

    public List<FamilyAddressResponse> getAddresses() {
        // implementation...
        return List.of();
    }

    public FamilyAddressResponse addAddress(FamilyAddressRequest request) {
        // implementation...
        return null;
    }

    public void deleteAddress(UUID addressId) {
        // implementation...
    }

    private FamilyProfileResponse mapToResponse(FamilyProfile profile) {
        // mapping logic
        return new FamilyProfileResponse();
    }

    // Add these methods to FamilyService

    @Transactional
    public void saveAgency(UUID agencyId) {
        UUID userId = securityUtils.getCurrentUserId();
        FamilyProfile profile = familyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        // Check if already saved
        // Implementation using SavedAgency entity and repository
    }

    @Transactional
    public void removeSavedAgency(UUID agencyId) {
        // implementation
    }

    public List<SavedAgencyResponse> getSavedAgencies() {
        // implementation
        return List.of();
    }
}
