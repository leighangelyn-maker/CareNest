package com.example.carenest.auth;

import com.example.carenest.auth.dto.*;
import com.example.carenest.auth.model.User;
import com.example.carenest.auth.model.Role;
import com.example.carenest.auth.model.UserStatus;
import com.example.carenest.config.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering user: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone number already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.FAMILY)
                .status(UserStatus.ACTIVE)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: {}", user.getEmail());

        String accessToken = jwtUtils.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getAgencyId()
        );

        String refreshToken = jwtUtils.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getAgencyId()
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId().toString())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .status(user.getStatus())
                        .build())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse registerAgency(RegisterAgencyRequest request) {
        log.info("Registering agency: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone number already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getAgencyName())
                .lastName("Agency")
                .role(Role.AGENCY_ADMIN)
                .status(UserStatus.PENDING_VERIFICATION)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);
        log.info("Agency registered successfully: {}", user.getEmail());

        String accessToken = jwtUtils.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getAgencyId()
        );

        String refreshToken = jwtUtils.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getAgencyId()
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId().toString())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .status(user.getStatus())
                        .build())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for user: {}", request.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            log.info("User logged in successfully: {}", user.getEmail());

            String accessToken = jwtUtils.generateToken(
                    user.getEmail(),
                    user.getRole().name(),
                    user.getId(),
                    user.getAgencyId()
            );

            String refreshToken = jwtUtils.generateToken(
                    user.getEmail(),
                    user.getRole().name(),
                    user.getId(),
                    user.getAgencyId()
            );

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .user(AuthResponse.UserInfo.builder()
                            .id(user.getId().toString())
                            .email(user.getEmail())
                            .role(user.getRole())
                            .status(user.getStatus())
                            .build())
                    .build();

        } catch (Exception e) {
            log.error("Login failed for user: {}", request.getEmail(), e);
            throw new RuntimeException("Invalid email or password");
        }
    }

    @Override
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        log.info("Refreshing token");

        try {
            String email = jwtUtils.getEmailFromToken(request.getRefreshToken());
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String newAccessToken = jwtUtils.generateToken(
                    user.getEmail(),
                    user.getRole().name(),
                    user.getId(),
                    user.getAgencyId()
            );

            return TokenResponse.builder()
                    .accessToken(newAccessToken)
                    .build();

        } catch (Exception e) {
            log.error("Refresh token failed", e);
            throw new RuntimeException("Invalid refresh token");
        }
    }

    @Override
    public void logout(RefreshTokenRequest request) {
        log.info("Logging out user");
        SecurityContextHolder.clearContext();
    }
}