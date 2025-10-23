package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordResponse {

    private boolean success;
    private String message;
    private String email;
    private LocalDateTime expiryDate;
    private String userType;
}
