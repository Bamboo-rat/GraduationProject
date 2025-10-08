package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterResponse {
    private String userId;
    private String keycloakId;
    private String username;
    private String email;
    private String message;
    private String status; // "PENDING_VERIFICATION", "PENDING_APPROVAL"
}
