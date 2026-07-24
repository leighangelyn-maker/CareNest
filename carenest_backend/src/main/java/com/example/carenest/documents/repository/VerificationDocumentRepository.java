package com.example.carenest.documents.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.carenest.documents.model.DocumentStatus;
import com.example.carenest.documents.model.VerificationDocument;

public interface VerificationDocumentRepository extends JpaRepository<VerificationDocument, UUID> {

    // Used by DocumentServiceImpl.getAgencyDocuments()
    List<VerificationDocument> findByAgencyId(UUID agencyId);

    // Used by both DocumentServiceImpl.getPendingDocuments() and
    // AdminServiceImpl.getPendingDocuments() - two separate existing
    // callers relying on the same method.
    Page<VerificationDocument> findByStatus(DocumentStatus status, Pageable pageable);

    // Used by DocumentServiceImpl.hasAgencyUploadedDocumentType(). Kept as
    // String (not DocumentType) to match the exact call site, which passes
    // documentType.name() - Spring Data JPA converts the String back to the
    // enum automatically when binding the query parameter.
    boolean existsByAgencyIdAndDocumentType(UUID agencyId, String documentType);

    // Used by AdminServiceImpl.getPlatformStats()
    long countByStatus(DocumentStatus status);
}