package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request for social login (Google, Facebook) via Keycloak Identity Provider
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Social login request (Google/Facebook)")
public class SocialLoginRequest {

    @NotBlank(message = "Authorization code is required")
    @Schema(description = "Authorization code from OAuth provider", example = "4/0AY0e-g7...")
    private String code;

    @NotBlank(message = "Redirect URI is required")
    @Schema(description = "Redirect URI used in authorization request", example = "http://localhost:3000/auth/callback")
    private String redirectUri;

    @Schema(description = "Social provider type", example = "google", allowableValues = {"google", "facebook"})
    private String provider; // "google" or "facebook"
}
