package com.example.carenest.auth;

import com.example.carenest.auth.dto.*;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse registerAgency(RegisterAgencyRequest request);
    AuthResponse registerAdmin(RegisterRequest request);  // ← ADD THIS
    AuthResponse login(LoginRequest request);
    TokenResponse refreshToken(RefreshTokenRequest request);
    void logout(RefreshTokenRequest request);
}