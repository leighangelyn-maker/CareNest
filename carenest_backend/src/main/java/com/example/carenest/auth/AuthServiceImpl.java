package com.example.carenest.auth;

import com.example.carenest.agency.Agency;
import com.example.carenest.agency.AgencyStatus;
import com.example.carenest.agency.VerificationStatus;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.auth.dto.*;
import com.example.carenest.auth.model.User;
import com.example.carenest.auth.model.Role;
import com.example.carenest.auth.model.UserStatus;
import com.example.carenest.auth.model.VerificationToken;
import com.example.carenest.config.JwtUtils;
import com.example.carenest.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import java.math.BigDecimal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.carenest.common.exception.DuplicateResourceException;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering user: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
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
                .status(UserStatus.PENDING_VERIFICATION)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: {}", user.getEmail());

        createAndSendVerificationToken(user);

        String accessToken = jwtUtils.generateAccessToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getAgencyId()
        );

        String refreshToken = jwtUtils.generateRefreshToken(
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

        try {
            // Check if user exists
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already registered");
            }

            if (userRepository.existsByPhone(request.getPhone())) {
                throw new RuntimeException("Phone number already registered");
            }

            // Check if agency exists
            if (agencyRepository.existsByEmail(request.getAgencyEmail())) {
                throw new RuntimeException("Agency email already registered");
            }

            if (agencyRepository.existsByPhone(request.getAgencyPhone())) {
                throw new RuntimeException("Agency phone already registered");
            }

            // Create User (Agency Admin) FIRST — Agency requires a valid user_id
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
            log.info("Agency admin user created successfully: {}", user.getEmail());

            createAndSendVerificationToken(user);

            // Generate slug from agency name
            String slug = request.getAgencyName()
                    .toLowerCase()
                    .replaceAll("[^a-z0-9]", "-")
                    .replaceAll("-+", "-");

            // Create Agency, linking it to the user we just created
            Agency agency = Agency.builder()
                    .user(user)
                    .name(request.getAgencyName())
                    .slug(slug)
                    .phone(request.getAgencyPhone())
                    .email(request.getAgencyEmail())
                    .description(request.getAgencyDescription())
                    .isAcceptingBookings(true)
                    .averageRating(BigDecimal.valueOf(0.0))
                    .totalReviews(0)
                    .status(AgencyStatus.ACTIVE)
                    .verificationStatus(VerificationStatus.PENDING)
                    .build();

            agency = agencyRepository.save(agency);
            log.info("Agency created successfully: {}", agency.getId());

            // Now link the user back to the agency
            user.setAgencyId(agency.getId());
            user = userRepository.save(user);

            // Generate tokens
            String accessToken = jwtUtils.generateAccessToken(
                    user.getEmail(),
                    user.getRole().name(),
                    user.getId(),
                    user.getAgencyId()
            );

            String refreshToken = jwtUtils.generateRefreshToken(
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
            log.error("Agency registration failed: {}", e.getMessage(), e);
            throw new RuntimeException("Agency registration failed: " + e.getMessage());
        }
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

            if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
                throw new RuntimeException("Please verify your email before logging in");
            }

            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            log.info("User logged in successfully: {}", user.getEmail());

            String accessToken = jwtUtils.generateAccessToken(
                    user.getEmail(),
                    user.getRole().name(),
                    user.getId(),
                    user.getAgencyId()
            );

            String refreshToken = jwtUtils.generateRefreshToken(
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
            if (!jwtUtils.validateToken(request.getRefreshToken())) {
                throw new RuntimeException("Invalid refresh token");
            }

            if (jwtUtils.isTokenExpired(request.getRefreshToken())) {
                throw new RuntimeException("Refresh token has expired");
            }

            String email = jwtUtils.getEmailFromToken(request.getRefreshToken());
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String newAccessToken = jwtUtils.generateAccessToken(
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
            throw new RuntimeException("Invalid refresh token: " + e.getMessage());
        }
    }

    @Override
    public void logout(RefreshTokenRequest request) {
        log.info("Logging out user");
        SecurityContextHolder.clearContext();
    }

    // ==================== ADMIN REGISTRATION ====================

    @Override
    @Transactional
    public AuthResponse registerAdmin(RegisterRequest request) {
        log.info("Registering admin: {}", request.getEmail());

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
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);
        log.info("Admin registered successfully: {}", user.getEmail());

        String accessToken = jwtUtils.generateAccessToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getAgencyId()
        );

        String refreshToken = jwtUtils.generateRefreshToken(
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

    // ==================== EMAIL VERIFICATION ====================

    @Override
    @Transactional
    public void verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (verificationToken.getUsedAt() != null) {
            throw new RuntimeException("This verification link has already been used");
        }

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification link has expired. Please request a new one.");
        }

        User user = verificationToken.getUser();
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepository.save(user);

        verificationToken.setUsedAt(LocalDateTime.now());
        verificationTokenRepository.save(verificationToken);

        log.info("Email verified for user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new RuntimeException("Email is already verified");
        }

        createAndSendVerificationToken(user);
    }

    private void createAndSendVerificationToken(User user) {
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        verificationTokenRepository.save(verificationToken);
        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), token);
    }
}