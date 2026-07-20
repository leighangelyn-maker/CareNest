package com.example.carenest.admin.service;

import com.example.carenest.admin.dto.AgencyVerificationRequest;
import com.example.carenest.admin.dto.PlatformStatsResponse;
import com.example.carenest.admin.dto.UserStatusUpdateRequest;
import com.example.carenest.agency.Agency;
import com.example.carenest.agency.AgencyStatus;
import com.example.carenest.agency.VerificationStatus;
import com.example.carenest.agency.repository.AgencyRepository;
import com.example.carenest.auth.model.User;
import com.example.carenest.auth.model.UserStatus;
import com.example.carenest.auth.UserRepository;
import com.example.carenest.documents.model.DocumentStatus;
import com.example.carenest.documents.model.VerificationDocument;
import com.example.carenest.documents.repository.VerificationDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;
    private final VerificationDocumentRepository documentRepository;

    // ==================== USER MANAGEMENT ====================

    @Override
    public Page<User> getAllUsers(Pageable pageable) {
        log.info("Fetching all users");
        return userRepository.findAll(pageable);
    }

    @Override
    public User getUser(UUID userId) {
        log.info("Fetching user: {}", userId);
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
    }

    @Override
    @Transactional
    public User updateUserStatus(UUID userId, UserStatusUpdateRequest request) {
        log.info("Updating user status: {} to {}", userId, request.getStatus());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        user.setStatus(request.getStatus());

        if (request.getStatus() == UserStatus.SUSPENDED) {
            log.info("User suspended: {} - Reason: {}", userId, request.getReason());
        }

        user = userRepository.save(user);
        log.info("User status updated successfully: {}", userId);

        return user;
    }

    // ==================== AGENCY MANAGEMENT ====================

    @Override
    public Page<Agency> getAllAgencies(Pageable pageable) {
        log.info("Fetching all agencies");
        return agencyRepository.findAll(pageable);
    }

    @Override
    public Agency getAgency(UUID agencyId) {
        log.info("Fetching agency: {}", agencyId);
        return agencyRepository.findById(agencyId)
                .orElseThrow(() -> new RuntimeException("Agency not found with ID: " + agencyId));
    }

    @Override
    @Transactional
    public Agency verifyAgency(UUID agencyId, AgencyVerificationRequest request) {
        log.info("Verifying agency: {} with status: {}", agencyId, request.getVerificationStatus());

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new RuntimeException("Agency not found with ID: " + agencyId));

        agency.setVerificationStatus(request.getVerificationStatus());

        if (request.getVerificationStatus() == VerificationStatus.VERIFIED) {
            userRepository.findByAgencyId(agencyId)
                    .ifPresent(user -> {
                        user.setStatus(UserStatus.ACTIVE);
                        userRepository.save(user);
                        log.info("Agency admin activated: {}", user.getEmail());
                    });
        }

        if (request.getVerificationStatus() == VerificationStatus.REJECTED) {
            log.info("Agency rejected: {} - Reason: {}", agencyId, request.getReason());
        }

        agency = agencyRepository.save(agency);
        log.info("Agency verification updated: {}", agencyId);

        return agency;
    }

    @Override
    @Transactional
    public Agency suspendAgency(UUID agencyId, String reason) {
        log.info("Suspending agency: {} - Reason: {}", agencyId, reason);

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new RuntimeException("Agency not found with ID: " + agencyId));

        agency.setStatus(AgencyStatus.SUSPENDED);
        agency = agencyRepository.save(agency);

        log.info("Agency suspended: {}", agencyId);
        return agency;
    }

    // ==================== DOCUMENT MANAGEMENT ====================

    @Override
    public Page<VerificationDocument> getPendingDocuments(Pageable pageable) {
        log.info("Fetching pending documents");
        return documentRepository.findByStatus(DocumentStatus.PENDING, pageable);
    }

    @Override
    @Transactional
    public VerificationDocument verifyDocument(UUID documentId, String status, String rejectionReason, UUID adminId) {
        log.info("Verifying document: {} with status: {}", documentId, status);

        VerificationDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));

        DocumentStatus documentStatus = DocumentStatus.valueOf(status);
        document.setStatus(documentStatus);
        document.setVerifiedAt(LocalDateTime.now());
        document.setVerifiedBy(adminId);

        if (documentStatus == DocumentStatus.REJECTED) {
            if (rejectionReason == null || rejectionReason.isEmpty()) {
                throw new RuntimeException("Rejection reason is required when rejecting a document");
            }
            document.setRejectionReason(rejectionReason);
        } else {
            document.setRejectionReason(null);
        }

        document = documentRepository.save(document);
        log.info("Document verified: {}", documentId);

        return document;
    }

    // ==================== STATISTICS ====================

    @Override
    public PlatformStatsResponse getPlatformStats() {
        log.info("Fetching platform statistics");

        long totalUsers = userRepository.count();
        long totalAgencies = agencyRepository.count();
        long totalDocuments = documentRepository.count();
        long pendingDocuments = documentRepository.countByStatus(DocumentStatus.PENDING);

        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);

        long pendingAgencies = agencyRepository.countByVerificationStatus(VerificationStatus.PENDING);

        return PlatformStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalAgencies(totalAgencies)
                .totalBookings(0) // Will be updated when booking module is added
                .totalDocuments(totalDocuments)
                .pendingDocuments(pendingDocuments)
                .pendingAgencies(pendingAgencies)
                .activeUsers(activeUsers)
                .suspendedUsers(suspendedUsers)
                .build();
    }
}