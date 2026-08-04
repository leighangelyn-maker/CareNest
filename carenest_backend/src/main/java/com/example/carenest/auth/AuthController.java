package com.example.carenest.auth;

import com.example.carenest.auth.dto.*;
import com.example.carenest.common.dto.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received registration request for: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Registration successful"));
    }

    @PostMapping("/register-agency")
    public ResponseEntity<ApiResponse<AuthResponse>> registerAgency(@Valid @RequestBody RegisterAgencyRequest request) {
        log.info("Received agency registration request for: {}", request.getEmail());
        AuthResponse response = authService.registerAgency(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Agency registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received login request for: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Received refresh token request");
        TokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Received logout request");
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }

    @PostMapping("/register-admin")
    @Operation(summary = "Register a new admin account")
    public ResponseEntity<ApiResponse<AuthResponse>> registerAdmin(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Admin registration successful"));
    }

    @GetMapping("/verify-email")
public ResponseEntity<String> verifyEmail(@RequestParam String token) {
    String html;
    HttpStatus status;

    try {
        authService.verifyEmail(token);
        html = renderVerificationPage(
                "Email verified!",
                "Your CareNest account is now active. You can close this page and log in from the app.",
                true
        );
        status = HttpStatus.OK;
    } catch (Exception ex) {
        log.warn("Email verification failed for token {}: {}", token, ex.getMessage());
        html = renderVerificationPage(
                "Verification link invalid or expired",
                "This link may have already been used, or it's expired. Please request a new verification email from the app.",
                false
        );
        status = HttpStatus.BAD_REQUEST;
    }

    return ResponseEntity.status(status)
            .contentType(MediaType.TEXT_HTML)
            .body(html);
}

private String renderVerificationPage(String heading, String message, boolean success) {
    String accentColor = success ? "#16a34a" : "#dc2626";
    String icon = success ? "&#10003;" : "&#10007;";

    return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>CareNest</title>
            </head>
            <body style="margin:0;background:#faf7f0;font-family:-apple-system,Arial,sans-serif;
                         display:flex;align-items:center;justify-content:center;min-height:100vh;">
              <div style="max-width:400px;padding:32px;text-align:center;">
                <div style="width:64px;height:64px;border-radius:32px;background:%s22;
                            display:flex;align-items:center;justify-content:center;
                            margin:0 auto 20px;font-size:28px;color:%s;">
                  %s
                </div>
                <h2 style="color:#1e293b;margin:0 0 12px;">%s</h2>
                <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0;">%s</p>
              </div>
            </body>
            </html>
            """.formatted(accentColor, accentColor, icon, heading, message);
}

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@RequestParam String email) {
        authService.resendVerification(email);
        return ResponseEntity.ok(ApiResponse.success("Verification email resent"));
    }
}

