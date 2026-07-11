package com.example.carenest.documents.service;

import com.example.carenest.documents.dto.DocumentResponse;
import com.example.carenest.documents.dto.DocumentVerificationRequest;
import com.example.carenest.documents.model.DocumentStatus;
import com.example.carenest.documents.model.DocumentType;
import com.example.carenest.documents.model.VerificationDocument;
import com.example.carenest.documents.repository.VerificationDocumentRepository;
import com.example.carenest.worker.model.WorkerProfile;
import com.example.carenest.worker.repository.WorkerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;  // ← ADD THIS IMPORT

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final VerificationDocumentRepository documentRepository;
    private final WorkerProfileRepository workerProfileRepository;

    @Value("${storage.upload-dir:uploads}")
    private String uploadDir;

    @Value("${storage.documents-dir:documents}")
    private String documentsDir;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final List<String> ALLOWED_FILE_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    @Override
    @Transactional
    public DocumentResponse uploadDocument(UUID workerId, MultipartFile file, DocumentType documentType, String description) {
        log.info("Uploading document for worker: {}, type: {}", workerId, documentType);

        // Validate worker exists
        WorkerProfile worker = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found with ID: " + workerId));

        // Validate file
        validateFile(file);

        try {
            // Create worker's document directory
            String workerDocDir = documentsDir + "/" + workerId;
            Path uploadPath = Paths.get(uploadDir, workerDocDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String filename = UUID.randomUUID() + extension;
            
            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Build file URL
            String fileUrl = "/uploads/" + workerDocDir + "/" + filename;

            // Create document record
            VerificationDocument document = VerificationDocument.builder()
                    .worker(worker)
                    .documentType(documentType)
                    .documentName(originalFilename != null ? originalFilename : filename)
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .fileType(file.getContentType())
                    .description(description)
                    .status(DocumentStatus.PENDING)
                    .build();

            document = documentRepository.save(document);
            log.info("Document uploaded successfully: {}", document.getId());

            return mapToResponse(document);

        } catch (IOException e) {
            log.error("Failed to upload document", e);
            throw new RuntimeException("Failed to upload document: " + e.getMessage());
        }
    }

    @Override
    public DocumentResponse getDocument(UUID documentId) {
        VerificationDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));
        return mapToResponse(document);
    }

    @Override
    public List<DocumentResponse> getWorkerDocuments(UUID workerId) {
        return documentRepository.findByWorkerId(workerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());  // ← Fixed: Added Collectors import
    }

    @Override
    public Page<DocumentResponse> getPendingDocuments(Pageable pageable) {
        return documentRepository.findByStatus(DocumentStatus.PENDING, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public DocumentResponse verifyDocument(UUID documentId, DocumentVerificationRequest request, UUID adminId) {
        log.info("Verifying document: {} with status: {}", documentId, request.getStatus());

        VerificationDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));

        document.setStatus(request.getStatus());
        document.setVerifiedAt(LocalDateTime.now());
        document.setVerifiedBy(adminId);

        if (request.getStatus() == DocumentStatus.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().isEmpty()) {
                throw new RuntimeException("Rejection reason is required when rejecting a document");
            }
            document.setRejectionReason(request.getRejectionReason());
        } else {
            document.setRejectionReason(null);
        }

        document = documentRepository.save(document);
        log.info("Document verified successfully: {}", documentId);

        return mapToResponse(document);
    }

    @Override
    @Transactional
    public void deleteDocument(UUID documentId) {
        log.info("Deleting document: {}", documentId);

        VerificationDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));

        // Delete physical file
        try {
            String filePath = document.getFileUrl().replace("/uploads/", "");
            Path path = Paths.get(uploadDir, filePath);
            if (Files.exists(path)) {
                Files.delete(path);
                log.info("File deleted: {}", path);
            }
        } catch (IOException e) {
            log.warn("Failed to delete physical file: {}", e.getMessage());
        }

        documentRepository.delete(document);
        log.info("Document deleted successfully: {}", documentId);
    }

    @Override
    public boolean hasWorkerUploadedDocumentType(UUID workerId, DocumentType documentType) {
        return documentRepository.existsByWorkerIdAndDocumentType(workerId, documentType.name());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds maximum allowed (10MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_FILE_TYPES.contains(contentType)) {
            throw new RuntimeException("File type not allowed. Allowed types: JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX");
        }
    }

    private DocumentResponse mapToResponse(VerificationDocument document) {
        WorkerProfile worker = document.getWorker();
        
        return DocumentResponse.builder()
                .id(document.getId())
                .workerId(worker.getId())
                .workerFirstName(worker.getFirstName())
                .workerLastName(worker.getLastName())
                .documentType(document.getDocumentType())
                .documentName(document.getDocumentName())
                .fileUrl(document.getFileUrl())
                .fileSize(document.getFileSize())
                .fileType(document.getFileType())
                .description(document.getDescription())
                .status(document.getStatus())
                .rejectionReason(document.getRejectionReason())
                .verifiedAt(document.getVerifiedAt())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}