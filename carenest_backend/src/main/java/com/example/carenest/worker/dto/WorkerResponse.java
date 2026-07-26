package com.example.carenest.worker.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.example.carenest.worker.Worker;
import com.example.carenest.worker.WorkerStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerResponse {

    private UUID id;
    private UUID agencyId;
    private String agencyName;
    private String agencyCity;
    private String agencyRegion;
    private String fullName;
    private String phoneNumber;
    private String email;
    private UUID serviceCategoryId;
    private String serviceCategoryName;
    private Integer defaultHourlyRateMinorUnits;
    private WorkerStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WorkerResponse fromEntity(Worker worker) {
        return WorkerResponse.builder()
                .id(worker.getId())
                .agencyId(worker.getAgency().getId())
                .agencyName(worker.getAgency().getName())
                .agencyCity(worker.getAgency().getCity())
                .agencyRegion(worker.getAgency().getRegion())
                .fullName(worker.getFullName())
                .phoneNumber(worker.getPhoneNumber())
                .email(worker.getEmail())
                .serviceCategoryId(worker.getServiceCategory().getId())
                // ASSUMPTION: ServiceCategory has a getName(). Adjust if your
                // actual field/accessor is named differently (e.g. getTitle()).
                .serviceCategoryName(worker.getServiceCategory().getName())
                .defaultHourlyRateMinorUnits(worker.getDefaultHourlyRateMinorUnits())
                .status(worker.getStatus())
                .createdAt(worker.getCreatedAt())
                .updatedAt(worker.getUpdatedAt())
                .build();
    }
}