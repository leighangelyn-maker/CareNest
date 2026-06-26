package com.example.carenest.documents.repository;

import com.example.carenest.documents.model.DocumentStatus;
import com.example.carenest.documents.model.VerificationDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VerificationDocumentRepository extends JpaRepository<VerificationDocument, UUID> {

    List<VerificationDocument> findByWorkerId(UUID workerId);

    Page<VerificationDocument> findByStatus(DocumentStatus status, Pageable pageable);

    List<VerificationDocument> findByWorkerIdAndStatus(UUID workerId, DocumentStatus status);

    boolean existsByWorkerIdAndDocumentType(UUID workerId, String documentType);

    long countByStatus(DocumentStatus status);

    long countByWorkerId(UUID workerId);
}