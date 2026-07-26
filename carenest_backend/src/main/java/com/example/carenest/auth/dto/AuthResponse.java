package com.example.carenest.auth.dto;

import com.example.carenest.auth.model.Role;
import com.example.carenest.auth.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserInfo user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;
        private String email;
        private Role role;
        private UserStatus status;
        // FIX: was missing entirely - agency-role users had no way for the
        // frontend to read their agencyId from the login response body,
        // even though it was already present as a claim inside the JWT.
        private String agencyId;
    }
}