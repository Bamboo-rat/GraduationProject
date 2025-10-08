package com.example.backend.service;

import com.example.backend.dto.request.LoginRequest;

import java.util.Map;

public interface KeycloakService {

    /**
     * Create a new user in Keycloak
     * @param username Username
     * @param email Email
     * @param password Password
     * @param firstName First name
     * @param lastName Last name
     * @return Keycloak user ID
     */
    String createKeycloakUser(String username, String email, String password, String firstName, String lastName);

    /**
     * Assign role to user in Keycloak
     * @param keycloakId Keycloak user ID
     * @param roleName Role name (customer, supplier, staff)
     */
    void assignRoleToUser(String keycloakId, String roleName);

    /**
     * Authenticate user and get access token
     * @param request Login request
     * @return Token response with access token, refresh token, etc.
     */
    Map<String, Object> authenticateUser(LoginRequest request);

    /**
     * Get user info from Keycloak
     * @param keycloakId Keycloak user ID
     * @return User info map
     */
    Map<String, Object> getUserInfo(String keycloakId);

    /**
     * Delete user from Keycloak
     * @param keycloakId Keycloak user ID
     */
    void deleteUser(String keycloakId);

    /**
     * Enable/Disable user in Keycloak
     * @param keycloakId Keycloak user ID
     * @param enabled true to enable, false to disable
     */
    void setUserEnabled(String keycloakId, boolean enabled);

    /**
     * Update user password in Keycloak
     * @param keycloakId Keycloak user ID
     * @param newPassword New password
     */
    void updateUserPassword(String keycloakId, String newPassword);
}
