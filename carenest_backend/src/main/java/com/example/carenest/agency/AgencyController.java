package com.example.carenest.agency;

import com.example.carenest.agency.dto.AgencyResponse;
import com.example.carenest.agency.dto.AgencySummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/agencies")
@RequiredArgsConstructor
public class AgencyController {

    private final AgencyService agencyService;

    @GetMapping
    public ResponseEntity<List<AgencySummaryResponse>> searchAgencies(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minRating) {
        return ResponseEntity.ok(agencyService.searchAgencies(category, city, minRating));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgencyResponse> getAgencyProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(agencyService.getAgencyProfile(id));
    }
}