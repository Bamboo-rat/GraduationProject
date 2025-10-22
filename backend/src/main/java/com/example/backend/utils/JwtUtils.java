package com.example.backend.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Utility class for JWT token operations
 * Changed from @UtilityClass to @Component to support JwtDecoder injection
 */
@Slf4j
@Component
public class JwtUtils {

    private static JwtDecoder jwtDecoder;

    @Autowired
    public void setJwtDecoder(JwtDecoder jwtDecoder) {
        JwtUtils.jwtDecoder = jwtDecoder;
    }

    /**
     * Decode JWT token string to Jwt object
     *
     * @param token JWT token string (without "Bearer " prefix)
     * @return Decoded Jwt object
     * @throws org.springframework.security.oauth2.jwt.JwtException if token is invalid
     */
    public static Jwt decodeToken(String token) {
        if (token == null || token.isEmpty()) {
            throw new IllegalArgumentException("Token cannot be null or empty");
        }
        
        // Remove "Bearer " prefix if present
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        return jwtDecoder.decode(token);
    }

    /**
     * Extract roles from JWT token
     * Keycloak stores client roles in: resource_access.{clientId}.roles
     * And realm roles in: realm_access.roles
     *
     * @param jwt JWT token
     * @param clientId Client ID to extract client-level roles
     * @return List of role names
     */
    @SuppressWarnings("unchecked")
    public static List<String> extractRoles(Jwt jwt, String clientId) {
        List<String> roles = new ArrayList<>();

        try {
            // Extract client-level roles (resource_access.{clientId}.roles)
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null && resourceAccess.containsKey(clientId)) {
                Map<String, Object> clientAccess = (Map<String, Object>) resourceAccess.get(clientId);
                if (clientAccess != null && clientAccess.containsKey("roles")) {
                    List<String> clientRoles = (List<String>) clientAccess.get("roles");
                    if (clientRoles != null) {
                        // Convert roles to match Spring Security format (super-admin -> SUPER_ADMIN)
                        clientRoles.stream()
                                .map(role -> role.toUpperCase().replace("-", "_"))
                                .forEach(roles::add);
                        log.debug("Extracted and converted client roles: {}", roles);
                    }
                }
            }

            // Extract realm-level roles (realm_access.roles)
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                List<String> realmRoles = (List<String>) realmAccess.get("roles");
                if (realmRoles != null) {
                    // Filter out default Keycloak roles and convert format
                    realmRoles.stream()
                            .filter(role -> !isDefaultKeycloakRole(role))
                            .map(role -> role.toUpperCase().replace("-", "_"))
                            .forEach(roles::add);
                    log.debug("Extracted and converted realm roles: {}", roles);
                }
            }

            log.info("Total converted roles extracted from JWT: {}", roles);
            return roles;

        } catch (Exception e) {
            log.error("Error extracting roles from JWT", e);
            return roles;
        }
    }

    /**
     * Extract subject (keycloakId) from JWT
     *
     * @param jwt JWT token
     * @return Keycloak user ID
     */
    public static String extractKeycloakId(Jwt jwt) {
        return jwt.getSubject();
    }

    /**
     * Extract username from JWT
     *
     * @param jwt JWT token
     * @return Username
     */
    public static String extractUsername(Jwt jwt) {
        return jwt.getClaim("preferred_username");
    }

    /**
     * Extract email from JWT
     *
     * @param jwt JWT token
     * @return Email
     */
    public static String extractEmail(Jwt jwt) {
        return jwt.getClaim("email");
    }

    /**
     * Check if email is verified in JWT
     *
     * @param jwt JWT token
     * @return true if email is verified
     */
    public static Boolean extractEmailVerified(Jwt jwt) {
        Boolean emailVerified = jwt.getClaim("email_verified");
        return emailVerified != null && emailVerified;
    }

    /**
     * Extract given name (first name) from JWT
     *
     * @param jwt JWT token
     * @return Given name
     */
    public static String extractGivenName(Jwt jwt) {
        return jwt.getClaim("given_name");
    }

    /**
     * Extract family name (last name) from JWT
     *
     * @param jwt JWT token
     * @return Family name
     */
    public static String extractFamilyName(Jwt jwt) {
        return jwt.getClaim("family_name");
    }

    /**
     * Extract full name from JWT
     *
     * @param jwt JWT token
     * @return Full name
     */
    public static String extractFullName(Jwt jwt) {
        return jwt.getClaim("name");
    }

    /**
     * Check if role is a default Keycloak role that should be filtered out
     *
     * @param role Role name
     * @return true if it's a default Keycloak role
     */
    private static boolean isDefaultKeycloakRole(String role) {
        return role.equals("offline_access") ||
                role.equals("uma_authorization") ||
                role.equals("default-roles-" + role) ||
                role.startsWith("default-roles-");
    }

    /**
     * Check if user has specific role
     *
     * @param jwt JWT token
     * @param clientId Client ID
     * @param roleName Role name to check
     * @return true if user has the role
     */
    public static boolean hasRole(Jwt jwt, String clientId, String roleName) {
        List<String> roles = extractRoles(jwt, clientId);
        return roles.contains(roleName);
    }

    /**
     * Check if user has any of the specified roles
     *
     * @param jwt JWT token
     * @param clientId Client ID
     * @param roleNames Role names to check
     * @return true if user has any of the roles
     */
    public static boolean hasAnyRole(Jwt jwt, String clientId, String... roleNames) {
        List<String> roles = extractRoles(jwt, clientId);
        for (String roleName : roleNames) {
            if (roles.contains(roleName)) {
                return true;
            }
        }
        return false;
    }
}
