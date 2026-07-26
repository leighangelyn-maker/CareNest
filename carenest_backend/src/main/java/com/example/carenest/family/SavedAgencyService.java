package com.example.carenest.family;

import java.util.List;
import java.util.UUID;

import com.example.carenest.family.dto.SavedAgencyResponse;

public interface SavedAgencyService {

    SavedAgencyResponse saveAgency(UUID familyId, UUID agencyId);

    void unsaveAgency(UUID familyId, UUID agencyId);

    List<SavedAgencyResponse> getSavedAgencies(UUID familyId);
}