package com.example.carenest.family;

import com.example.carenest.family.dto.FamilyProfileResponse;
import com.example.carenest.family.dto.FamilyProfileUpdateRequest;
import com.example.carenest.family.dto.FamilyAddressRequest;
import com.example.carenest.family.dto.FamilyAddressResponse;
import com.example.carenest.family.dto.SavedAgencyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/family/me")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FAMILY')")
public class FamilyController {

    private final FamilyService familyService;

    @GetMapping
    public ResponseEntity<FamilyProfileResponse> getProfile() {
        return ResponseEntity.ok(familyService.getCurrentFamilyProfile());
    }

    @PatchMapping
    public ResponseEntity<FamilyProfileResponse> updateProfile(
            @RequestBody FamilyProfileUpdateRequest request) {
        return ResponseEntity.ok(familyService.updateProfile(request));
    }

    // Address endpoints
    @GetMapping("/addresses")
    public ResponseEntity<List<FamilyAddressResponse>> getAddresses() {
        return ResponseEntity.ok(familyService.getAddresses());
    }

    @PostMapping("/addresses")
    public ResponseEntity<FamilyAddressResponse> addAddress(
            @RequestBody FamilyAddressRequest request) {
        return ResponseEntity.ok(familyService.addAddress(request));
    }

    @DeleteMapping("/addresses/{addressId}")
    public ResponseEntity<Void> deleteAddress(@PathVariable UUID addressId) {
        familyService.deleteAddress(addressId);
        return ResponseEntity.noContent().build();
    }

    // Add to existing FamilyController

    @PostMapping("/saved-agencies/{agencyId}")
    public ResponseEntity<Void> saveAgency(@PathVariable UUID agencyId) {
        familyService.saveAgency(agencyId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/saved-agencies/{agencyId}")
    public ResponseEntity<Void> removeSavedAgency(@PathVariable UUID agencyId) {
        familyService.removeSavedAgency(agencyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/saved-agencies")
    public ResponseEntity<List<SavedAgencyResponse>> getSavedAgencies() {
        return ResponseEntity.ok(familyService.getSavedAgencies());
    }
}
