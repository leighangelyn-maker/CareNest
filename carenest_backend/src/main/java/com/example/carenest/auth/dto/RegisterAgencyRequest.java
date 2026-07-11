package com.example.carenest.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterAgencyRequest {

    // User fields
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Invalid phone number format")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    // Agency fields
    @NotBlank(message = "Agency name is required")
    private String agencyName;

    @NotBlank(message = "Agency phone is required")
    private String agencyPhone;

    @NotBlank(message = "Agency email is required")
    @Email(message = "Invalid agency email format")
    private String agencyEmail;

    private String agencyDescription;
}