package com.example.carenest.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatsResponse {

    private long totalUsers;
    private long totalAgencies;
    private long totalWorkers;
    private long totalBookings;
    private long totalDocuments;
    private long pendingDocuments;
    private long pendingAgencies;
    private long activeUsers;
    private long suspendedUsers;
}