package com.example.carenest.family.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class FamilyProfileResponse {

    private UUID id;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private String householdNotes;
    private String emergencyContactName;
    private String emergencyContactPhone;
}
