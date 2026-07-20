package com.example.carenest.family.dto;

import lombok.Data;

@Data
public class FamilyProfileUpdateRequest {

    private String firstName;
    private String lastName;
    private String householdNotes;
    private String emergencyContactName;
    private String emergencyContactPhone;
}
