package com.example.carenest.agency.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyDashboardResponse {
    private Integer totalBookings;
    private Integer activeBookings;
    private Integer completedBookings;
    private Integer cancelledBookings;
    private Integer totalWorkers;
    private Integer activeWorkers;
    private Integer pendingPayouts;
    private Integer totalRevenueMinorUnits;
    private String totalRevenueDisplay;
}
