package com.example.carenest.agency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyRevenueResponse {
    private Integer totalRevenueMinorUnits;
    private String totalRevenueDisplay;
    private Integer platformFeesMinorUnits;
    private String platformFeesDisplay;
    private Integer agencyPayoutsMinorUnits;
    private String agencyPayoutsDisplay;
    private Integer bookingCount;
    private List<RevenueBreakdown> breakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueBreakdown {
        private String month;
        private Integer revenueMinorUnits;
        private Integer bookingCount;
    }
}
