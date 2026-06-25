package com.example.carenest.worker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerAvailabilityRequest {
    private Boolean isAvailable;
    private List<String> availableDays;
}