package com.example.carenest.admin.service;

import com.example.carenest.admin.dto.AgencyVerificationRequest;
import com.example.carenest.admin.dto.PlatformStatsResponse;
import com.example.carenest.admin.dto.UserStatusUpdateRequest;
import com.example.carenest.agency.Agency;
import com.example.carenest.auth.model.User;
import com.example.carenest.documents.model.VerificationDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminService {

    // User Management
    Page<User> getAllUsers(Pageable pageable);
    User getUser(UUID userId);
    User updateUserStatus(UUID userId, UserStatusUpdateRequest request);

    // Agency Management
    Page<Agency> getAllAgencies(Pageable pageable);
    Agency getAgency(UUID agencyId);
    Agency verifyAgency(UUID agencyId, AgencyVerificationRequest request);
    Agency suspendAgency(UUID agencyId, String reason);

    // Document Management
    Page<VerificationDocument> getPendingDocuments(Pageable pageable);
    VerificationDocument verifyDocument(UUID documentId, String status, String rejectionReason, UUID adminId);

    // Statistics
    PlatformStatsResponse getPlatformStats();

    // Reports
    // Additional admin functions can be added here
}