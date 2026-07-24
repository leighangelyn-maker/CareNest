package com.example.carenest.family;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.common.dto.response.ApiResponse;
import com.example.carenest.family.dto.SavedAgencyResponse;
import com.example.carenest.security.SecurityUtils;

@Slf4j
@RestController
@RequestMapping("/saved-agencies")
@RequiredArgsConstructor
public class SavedAgencyController {

    private final SavedAgencyService savedAgencyService;
    private final SecurityUtils securityUtils;

    @PostMapping("/{agencyId}")
    public ResponseEntity<ApiResponse<SavedAgencyResponse>> saveAgency(@PathVariable UUID agencyId) {
        UUID familyId = securityUtils.getCurrentUserId();
        SavedAgencyResponse response = savedAgencyService.saveAgency(familyId, agencyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Agency saved successfully"));
    }

    @DeleteMapping("/{agencyId}")
    public ResponseEntity<ApiResponse<Void>> unsaveAgency(@PathVariable UUID agencyId) {
        UUID familyId = securityUtils.getCurrentUserId();
        savedAgencyService.unsaveAgency(familyId, agencyId);
        return ResponseEntity.ok(ApiResponse.success("Agency removed from saved list"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavedAgencyResponse>>> getSavedAgencies() {
        UUID familyId = securityUtils.getCurrentUserId();
        List<SavedAgencyResponse> response = savedAgencyService.getSavedAgencies(familyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Saved agencies retrieved successfully"));
    }
}