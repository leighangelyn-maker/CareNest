package com.example.carenest.documents.service;

import com.example.carenest.documents.dto.DocumentResponse;
import com.example.carenest.documents.dto.DocumentVerificationRequest;
import com.example.carenest.documents.model.DocumentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface DocumentService {

    DocumentResponse uploadDocument(UUID workerId, MultipartFile file, DocumentType documentType, String description);

    DocumentResponse getDocument(UUID documentId);

    List<DocumentResponse> getWorkerDocuments(UUID workerId);

    Page<DocumentResponse> getPendingDocuments(Pageable pageable);

    DocumentResponse verifyDocument(UUID documentId, DocumentVerificationRequest request, UUID adminId);

    void deleteDocument(UUID documentId);

    boolean hasWorkerUploadedDocumentType(UUID workerId, DocumentType documentType);
}