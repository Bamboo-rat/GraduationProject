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
     * Converts keycloakId (JWT subject) to actual userId from database.
     *
     * @param authentication Spring Security Authentication object
     * @return userId from database
     * @throws NotFoundException if user not found with keycloakId
     */
    public String extractUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = jwt.getSubject();
        
        // Get actual userId from database using keycloakId
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND, "keycloakId: " + keycloakId));
        
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
