package com.example.backend.util;

import com.example.backend.entity.User;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationUtil {

    private final UserRepository userRepository;

    /**
     * Extract userId from JWT token.
     * Handles both:
     * 1. Custom customer tokens (subject = userId)
     * 2. Keycloak tokens for admin/supplier (subject = keycloakId)
     *
     * @param authentication Spring Security Authentication object
     * @return userId from database
     * @throws NotFoundException if user not found
     */
    public String extractUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String subject = jwt.getSubject();

        User user = userRepository.findById(subject)
                .or(() -> userRepository.findByKeycloakId(subject))
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND, "subject: " + subject));

        return user.getUserId();
    }

    /**
     * Extract keycloakId directly from JWT token.
     *
     * @param authentication Spring Security Authentication object
     * @return keycloakId (JWT subject)
     */
    public String extractKeycloakId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }
}
