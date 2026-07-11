package com.example.carenest.agency.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class WorkerSummaryResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String photoUrl;
    private int yearsExperience;
    private double averageRating;
}
