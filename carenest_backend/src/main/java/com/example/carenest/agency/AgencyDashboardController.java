package com.example.carenest.agency;

import com.example.carenest.agency.dto.AgencyDashboardResponse;
import com.example.carenest.agency.dto.AgencyRevenueResponse;
import com.example.carenest.agency.service.AgencyDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/agencies/{agencyId}/dashboard")
@RequiredArgsConstructor
@Tag(name = "Agency Dashboard", description = "Agency dashboard and analytics APIs")
public class AgencyDashboardController {

    private final AgencyDashboardService agencyDashboardService;

    @GetMapping
    @Operation(summary = "Get agency dashboard statistics")
    public ResponseEntity<AgencyDashboardResponse> getDashboardStats(@PathVariable UUID agencyId) {
        log.info("Fetching dashboard stats for agency: {}", agencyId);
        AgencyDashboardResponse response = agencyDashboardService.getDashboardStats(agencyId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get agency revenue for a date range")
    public ResponseEntity<AgencyRevenueResponse> getAgencyRevenue(
            @PathVariable UUID agencyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        log.info("Fetching revenue for agency: {} from {} to {}", agencyId, startDate, endDate);
        AgencyRevenueResponse response = agencyDashboardService.getAgencyRevenue(agencyId, startDate, endDate);
        return ResponseEntity.ok(response);
    }
}
