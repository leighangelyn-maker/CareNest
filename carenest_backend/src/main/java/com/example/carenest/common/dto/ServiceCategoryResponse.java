package com.example.carenest.common.dto;

import java.util.UUID;

import com.example.carenest.common.ServiceCategory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategoryResponse {

    private UUID id;
    private String slug;
    private String name;
    private String description;

    public static ServiceCategoryResponse fromEntity(ServiceCategory category) {
        return ServiceCategoryResponse.builder()
                .id(category.getId())
                .slug(category.getSlug())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }
}