package com.example.carenest.family;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.agency.Agency;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.common.exception.BadRequestException;
import com.example.carenest.common.exception.ResourceNotFoundException;
import com.example.carenest.family.dto.SavedAgencyResponse;
import com.example.carenest.family.repository.FamilyProfileRepository;
import com.example.carenest.family.repository.SavedAgencyRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class SavedAgencyServiceImpl implements SavedAgencyService {

    private final SavedAgencyRepository savedAgencyRepository;
    private final FamilyProfileRepository familyProfileRepository;
    private final AgencyRepository agencyRepository;

    @Override
    @Transactional
    public SavedAgencyResponse saveAgency(UUID familyId, UUID agencyId) {
        if (savedAgencyRepository.existsByFamily_IdAndAgency_Id(familyId, agencyId)) {
            throw new BadRequestException("This agency is already saved");
        }

        FamilyProfile family = familyProfileRepository.findById(familyId)
                .orElseThrow(() -> new ResourceNotFoundException("Family not found: " + familyId));

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Agency not found: " + agencyId));

        SavedAgency savedAgency = SavedAgency.builder()
                .family(family)
                .agency(agency)
                .build();

        SavedAgency saved = savedAgencyRepository.save(savedAgency);
        log.info("Family {} saved agency {}", familyId, agencyId);
        return SavedAgencyResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void unsaveAgency(UUID familyId, UUID agencyId) {
        SavedAgency savedAgency = savedAgencyRepository.findByFamily_IdAndAgency_Id(familyId, agencyId)
                .orElseThrow(() -> new ResourceNotFoundException("This agency is not saved"));

        savedAgencyRepository.delete(savedAgency);
        log.info("Family {} unsaved agency {}", familyId, agencyId);
    }

    @Override
    public List<SavedAgencyResponse> getSavedAgencies(UUID familyId) {
        return savedAgencyRepository.findByFamily_IdOrderByCreatedAtDesc(familyId).stream()
                .map(SavedAgencyResponse::fromEntity)
                .toList();
    }
}