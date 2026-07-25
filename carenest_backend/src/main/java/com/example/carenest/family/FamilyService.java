package com.example.carenest.family;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.example.carenest.common.exception.BadRequestException;
import com.example.carenest.common.exception.ResourceNotFoundException;
import com.example.carenest.family.dto.*;
import com.example.carenest.family.repository.FamilyAddressRepository;
import com.example.carenest.family.repository.FamilyProfileRepository;
import com.example.carenest.security.SecurityUtils;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyProfileRepository familyProfileRepository;
    private final FamilyAddressRepository familyAddressRepository;
    private final SavedAgencyService savedAgencyService;
    private final SecurityUtils securityUtils;

    public FamilyProfileResponse getCurrentFamilyProfile() {
        UUID userId = securityUtils.getCurrentUserId();
        FamilyProfile profile = familyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return mapToResponse(profile);
    }

    @Transactional
    public FamilyProfileResponse updateProfile(FamilyProfileUpdateRequest request) {
        // NOTE: still a stub, unrelated to the address/saved-agency fix -
        // flagging that this (and mapToResponse below) likely need the same
        // treatment addAddress() just got, since they return null/empty too.
        return null; // placeholder
    }

    public List<FamilyAddressResponse> getAddresses() {
        FamilyProfile profile = getCurrentProfile();
        return familyAddressRepository.findByFamilyProfileId(profile.getId()).stream()
                .map(this::mapAddressToResponse)
                .toList();
    }

    @Transactional
    public FamilyAddressResponse addAddress(FamilyAddressRequest request) {
        FamilyProfile profile = getCurrentProfile();

        // Only one address can be default at a time - unset any existing
        // default before setting this one, if this one is marked default.
        if (request.isDefault()) {
            List<FamilyAddress> existing = familyAddressRepository.findByFamilyProfileId(profile.getId());
            existing.stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                    .forEach(a -> {
                        a.setIsDefault(false);
                        familyAddressRepository.save(a);
                    });
        }

        FamilyAddress address = FamilyAddress.builder()
                .familyProfile(profile)
                .label(request.getLabel())
                .line1(request.getLine1())
                .line2(request.getLine2())
                .city(request.getCity())
                .region(request.getRegion())
                .latitude(request.getLatitude() != null ? request.getLatitude().doubleValue() : null)
                .longitude(request.getLongitude() != null ? request.getLongitude().doubleValue() : null)
                .isDefault(request.isDefault())
                .build();

        FamilyAddress saved = familyAddressRepository.save(address);
        return mapAddressToResponse(saved);
    }

    @Transactional
    public void deleteAddress(UUID addressId) {
        FamilyProfile profile = getCurrentProfile();

        FamilyAddress address = familyAddressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + addressId));

        if (!address.getFamilyProfile().getId().equals(profile.getId())) {
            throw new BadRequestException("You can only delete your own addresses");
        }

        familyAddressRepository.delete(address);
    }

    @Transactional
    public void saveAgency(UUID agencyId) {
        FamilyProfile profile = getCurrentProfile();
        savedAgencyService.saveAgency(profile.getId(), agencyId);
    }

    @Transactional
    public void removeSavedAgency(UUID agencyId) {
        FamilyProfile profile = getCurrentProfile();
        savedAgencyService.unsaveAgency(profile.getId(), agencyId);
    }

    public List<SavedAgencyResponse> getSavedAgencies() {
        FamilyProfile profile = getCurrentProfile();
        return savedAgencyService.getSavedAgencies(profile.getId());
    }

    private FamilyProfile getCurrentProfile() {
        UUID userId = securityUtils.getCurrentUserId();
        return familyProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
    }

    private FamilyAddressResponse mapAddressToResponse(FamilyAddress address) {
        FamilyAddressResponse response = new FamilyAddressResponse();
        response.setId(address.getId());
        response.setLabel(address.getLabel());
        response.setLine1(address.getLine1());
        response.setCity(address.getCity());
        response.setRegion(address.getRegion());
        response.setLatitude(address.getLatitude() != null ? BigDecimal.valueOf(address.getLatitude()) : null);
        response.setLongitude(address.getLongitude() != null ? BigDecimal.valueOf(address.getLongitude()) : null);
        response.setDefault(Boolean.TRUE.equals(address.getIsDefault()));
        return response;
    }

    private FamilyProfileResponse mapToResponse(FamilyProfile profile) {
        // mapping logic
        return new FamilyProfileResponse();
    }
}