package com.example.backend.service.impl;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.KeycloakException;
import com.example.backend.service.KeycloakService;
import com.nimbusds.jwt.JWT;
import com.nimbusds.jwt.JWTParser;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class
KeycloakServiceImpl implements KeycloakService {

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.resource}")
    private String clientId;

    @Value("${keycloak.customer.client-secret}")
    private String clientSecret;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    @Value("${keycloak.admin.client-id}")
    private String adminClientId;

    private Keycloak getKeycloakAdminClient() {
        return KeycloakBuilder.builder()
                .serverUrl(authServerUrl)
                .realm("master")
                .clientId(adminClientId)
                .username(adminUsername)
                .password(adminPassword)
                .build();
    }

    @Override
    public String createKeycloakUser(String username, String email, String password, String firstName, String lastName) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();

            UserRepresentation user = new UserRepresentation();
            user.setEnabled(true);
            user.setUsername(username);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmailVerified(true);

            Response response = usersResource.create(user);

            if (response.getStatus() != 201) {
                log.error("Failed to create user in Keycloak. Status: {}, Response: {}",
                        response.getStatus(), response.readEntity(String.class));
                throw new KeycloakException(ErrorCode.KEYCLOAK_USER_CREATION_FAILED);
            }

            String locationPath = response.getLocation().getPath();
            String userId = locationPath.substring(locationPath.lastIndexOf('/') + 1);

            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setTemporary(false);
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(password);

            UserResource userResource = usersResource.get(userId);
            userResource.resetPassword(credential);

            log.info("Successfully created user in Keycloak with ID: {}", userId);
            return userId;

        } catch (KeycloakException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating user in Keycloak", e);
            throw new KeycloakException(ErrorCode.KEYCLOAK_USER_CREATION_FAILED);
        }
    }

    @Override
    public void assignRoleToUser(String keycloakId, String roleName) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);

            // Get realm role (not client role)
            RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();

            // Assign realm role
            userResource.roles().realmLevel().add(Collections.singletonList(role));

            log.info("Successfully assigned realm role {} to user {}", roleName, keycloakId);

        } catch (Exception e) {
            log.error("Error assigning role '{}' to user {} in Keycloak: {}", roleName, keycloakId, e.getMessage());
            throw new KeycloakException(ErrorCode.KEYCLOAK_ROLE_ASSIGNMENT_FAILED);
        }
    }

    @Override
    public void removeRoleFromUser(String keycloakId, String roleName) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);

            // Get realm role (not client role)
            RoleRepresentation role = realmResource.roles().get(roleName).toRepresentation();

            // Remove realm role
            userResource.roles().realmLevel().remove(Collections.singletonList(role));

            log.info("Successfully removed realm role {} from user {}", roleName, keycloakId);

        } catch (Exception e) {
            log.error("Error removing role '{}' from user {} in Keycloak: {}", roleName, keycloakId, e.getMessage());
            throw new KeycloakException(ErrorCode.KEYCLOAK_ROLE_ASSIGNMENT_FAILED);
        }
    }

    @Override
    public Map<String, Object> authenticateUser(LoginRequest request) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String tokenUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("grant_type", "password");
            map.add("client_id", clientId);
            map.add("client_secret", clientSecret);
            map.add("username", request.getUsername());
            map.add("password", request.getPassword());

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("User {} authenticated successfully", request.getUsername());
                @SuppressWarnings("unchecked")
                Map<String, Object> body = response.getBody();
                return body;
            } else {
                throw new KeycloakException(ErrorCode.KEYCLOAK_AUTHENTICATION_FAILED);
            }

        } catch (KeycloakException e) {
            throw e;
        } catch (Exception e) {
            log.error("Authentication failed for user: {}", request.getUsername(), e);
            throw new KeycloakException(ErrorCode.KEYCLOAK_AUTHENTICATION_FAILED);
        }
    }

    @Override
    public Map<String, Object> getUserInfo(String keycloakId) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);
            UserRepresentation user = userResource.toRepresentation();

            return Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                    "lastName", user.getLastName() != null ? user.getLastName() : "",
                    "enabled", user.isEnabled(),
                    "emailVerified", user.isEmailVerified()
            );

        } catch (Exception e) {
            log.error("Error getting user info from Keycloak", e);
            throw new KeycloakException(ErrorCode.KEYCLOAK_USER_NOT_FOUND);
        }
    }

    @Override
    public void deleteUser(String keycloakId) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            realmResource.users().get(keycloakId).remove();
            log.info("Successfully deleted user {} from Keycloak", keycloakId);

        } catch (Exception e) {
            log.error("Error deleting user from Keycloak", e);
            throw new KeycloakException(ErrorCode.KEYCLOAK_USER_DELETION_FAILED);
        }
    }

    @Override
    public void deleteKeycloakUser(String keycloakId) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UsersResource usersResource = realmResource.users();
            
            usersResource.get(keycloakId).remove();

            log.info("Successfully deleted user {} from Keycloak", keycloakId);

        } catch (Exception e) {
            log.error("Error deleting user {} from Keycloak", keycloakId, e);
            throw new KeycloakException(ErrorCode.KEYCLOAK_USER_DELETION_FAILED);
        }
    }

    @Override
    public void setUserEnabled(String keycloakId, boolean enabled) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);
            UserRepresentation user = userResource.toRepresentation();
            user.setEnabled(enabled);
            userResource.update(user);

            log.info("Successfully {} user {} in Keycloak", enabled ? "enabled" : "disabled", keycloakId);

        } catch (Exception e) {
            log.error("Error updating user enabled status in Keycloak", e);
            throw new KeycloakException(ErrorCode.KEYCLOAK_USER_UPDATE_FAILED);
        }
    }

    @Override
    public void updateUserPassword(String keycloakId, String newPassword) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);

            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setTemporary(false);
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(newPassword);

            userResource.resetPassword(credential);
            log.info("Successfully updated password for user {} in Keycloak", keycloakId);

        } catch (Exception e) {
            log.error("Error updating user password in Keycloak", e);
            throw new KeycloakException(ErrorCode.KEYCLOAK_PASSWORD_UPDATE_FAILED);
        }
    }

    @Override
    public void updateKeycloakUser(String keycloakId, String email, String firstName, String lastName) {
        try (Keycloak keycloak = getKeycloakAdminClient()) {
            RealmResource realmResource = keycloak.realm(realm);
            UserResource userResource = realmResource.users().get(keycloakId);

            // Get current user representation
            UserRepresentation user = userResource.toRepresentation();

            // Update fields if provided (non-null)
            if (email != null && !email.isBlank()) {
                user.setEmail(email);
            }
            if (firstName != null) {
                user.setFirstName(firstName);
            }
            if (lastName != null) {
                user.setLastName(lastName);
            }

            // Update user in Keycloak
            userResource.update(user);

            log.info("Successfully updated user {} in Keycloak (email: {}, firstName: {}, lastName: {})",
                    keycloakId, email, firstName, lastName);

        } catch (Exception e) {
            log.error("Error updating user info in Keycloak for user {}", keycloakId, e);
            throw new KeycloakException(ErrorCode.KEYCLOAK_USER_UPDATE_FAILED);
        }
    }

    @Override
    public Map<String, Object> refreshAccessToken(String refreshToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String tokenUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("grant_type", "refresh_token");
            map.add("client_id", clientId);
            map.add("client_secret", clientSecret);
            map.add("refresh_token", refreshToken);

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("Token refreshed successfully");
                @SuppressWarnings("unchecked")
                Map<String, Object> body = response.getBody();
                return body;
            } else {
                throw new KeycloakException(ErrorCode.INVALID_REFRESH_TOKEN);
            }

        } catch (KeycloakException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to refresh token", e);
            throw new KeycloakException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
    }

    @Override
    public void revokeToken(String refreshToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String revokeUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/logout";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("client_id", clientId);
            map.add("client_secret", clientSecret);
            map.add("refresh_token", refreshToken);

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);
            ResponseEntity<String> response = restTemplate.exchange(revokeUrl, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode() == HttpStatus.NO_CONTENT || response.getStatusCode() == HttpStatus.OK) {
                log.info("Token revoked successfully");
            } else {
                log.warn("Token revocation returned status: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            // Don't throw exception on logout failure, just log it
            log.error("Failed to revoke token", e);
        }
    }

    @Override
    public Map<String, Object> exchangeSocialLoginCode(String code, String redirectUri, String provider) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String tokenUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("grant_type", "authorization_code");
            map.add("client_id", clientId);
            map.add("client_secret", clientSecret);
            map.add("code", code);
            map.add("redirect_uri", redirectUri);

            log.debug("Exchanging {} code with redirectUri: {}", provider, redirectUri);

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("Successfully exchanged {} authorization code for tokens", provider);
                @SuppressWarnings("unchecked")
                Map<String, Object> body = response.getBody();
                return body;
            } else {
                log.error("Failed to exchange {} authorization code. Status: {}", provider, response.getStatusCode());
                throw new KeycloakException(ErrorCode.SOCIAL_LOGIN_FAILED);
            }

        } catch (KeycloakException e) {
            throw e;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // Parse Keycloak error response for better debugging
            String errorBody = e.getResponseBodyAsString();
            log.error("Keycloak token exchange failed for {}: {} - Response: {}", 
                     provider, e.getStatusCode(), errorBody);
            
            // Common OAuth errors
            if (errorBody.contains("invalid_grant")) {
                log.error("Invalid grant error - possible causes: " +
                         "1) Authorization code already used or expired (codes are single-use and expire in ~5 minutes), " +
                         "2) Redirect URI mismatch between frontend and Keycloak Identity Provider config, " +
                         "3) Code was issued to different client");
            }
            
            throw new KeycloakException(ErrorCode.SOCIAL_LOGIN_FAILED);
        } catch (Exception e) {
            log.error("Error exchanging {} authorization code: {}", provider, e.getMessage(), e);
            throw new KeycloakException(ErrorCode.SOCIAL_LOGIN_FAILED);
        }
    }

    @Override
    public Map<String, Object> getUserInfoFromToken(String accessToken) {
        try {
            // Parse JWT token using Nimbus JOSE+JWT library
            JWT jwt = JWTParser.parse(accessToken);
            Map<String, Object> claims = jwt.getJWTClaimsSet().getClaims();

            // Extract standard claims
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("sub", claims.get("sub")); // Keycloak user ID
            userInfo.put("email", claims.get("email"));
            userInfo.put("name", claims.get("name"));
            userInfo.put("given_name", claims.get("given_name"));
            userInfo.put("family_name", claims.get("family_name"));
            userInfo.put("preferred_username", claims.get("preferred_username"));

            log.info("Successfully decoded JWT token for user: {}", claims.get("sub"));
            return userInfo;

        } catch (Exception e) {
            log.error("Error decoding JWT token: {}", e.getMessage(), e);
            throw new KeycloakException(ErrorCode.TOKEN_INVALID);
        }
    }
}
