package com.example.carenest.admin.dto;

import com.example.carenest.auth.model.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private UserStatus status;

    private String reason;
}