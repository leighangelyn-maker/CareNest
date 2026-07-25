package com.example.carenest.common;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.example.carenest.common.dto.response.ServiceCategoryResponse;
import com.example.carenest.common.dto.response.ApiResponse;
import com.example.carenest.common.exception.ResourceNotFoundException;

/**
 * Read-only reference data - the "Nanny / Cleaning / Cooking" category list
 * the frontend selects from when creating a booking or filtering worker
 * search. No create/update/delete here deliberately; categories are
 * seeded/managed directly in the database for now, not via API.
 */
@Slf4j
@RestController
@RequestMapping("/service-categories")
@RequiredArgsConstructor
public class ServiceCategoryController {

    private final ServiceCategoryRepository serviceCategoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceCategoryResponse>>> getAllCategories() {
        List<ServiceCategoryResponse> response = serviceCategoryRepository.findAll().stream()
                .map(ServiceCategoryResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response, "Service categories retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceCategoryResponse>> getCategoryById(@PathVariable UUID id) {
        ServiceCategory category = serviceCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service category not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(ServiceCategoryResponse.fromEntity(category), "Service category retrieved successfully"));
    }
}