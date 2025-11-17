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
     * Remove role from user in Keycloak
     * @param keycloakId Keycloak user ID
     * @param roleName Role name to remove
     */
    void removeRoleFromUser(String keycloakId, String roleName);

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
     * Delete user from Keycloak
     * @param keycloakId Keycloak user ID
     */
    void deleteKeycloakUser(String keycloakId);

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

    /**
     * Update user information in Keycloak
     * @param keycloakId Keycloak user ID
     * @param email Email (can be null to keep existing)
     * @param firstName First name (can be null to keep existing)
     * @param lastName Last name (can be null to keep existing)
     */
    void updateKeycloakUser(String keycloakId, String email, String firstName, String lastName);

    /**
     * Refresh access token using refresh token
     * @param refreshToken Refresh token
     * @return Token response with new access token
     */
    Map<String, Object> refreshAccessToken(String refreshToken);

    /**
     * Logout user by revoking refresh token
     * @param refreshToken Refresh token to revoke
     */
    void revokeToken(String refreshToken);

    /**
     * Exchange OAuth2 authorization code for tokens via Keycloak Identity Provider
     * @param code Authorization code from OAuth provider
     * @param redirectUri Redirect URI used in OAuth flow
     * @param provider Provider name (google, facebook)
     * @return Token response with access_token, refresh_token, etc.
     */
    Map<String, Object> exchangeSocialLoginCode(String code, String redirectUri, String provider);

    /**
     * Decode JWT token and extract user information
     * @param accessToken JWT access token
     * @return User info map with sub (keycloakId), email, name, etc.
     */
    Map<String, Object> getUserInfoFromToken(String accessToken);
}
