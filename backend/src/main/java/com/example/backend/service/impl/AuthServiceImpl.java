package com.example.backend.service.impl;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.response.*;
import com.example.backend.entity.Admin;
import com.example.backend.entity.Customer;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.AdminStatus;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.SupplierStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.exception.custom.UnauthorizedException;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AuthService;
import com.example.backend.service.KeycloakService;
import com.example.backend.service.OtpService;
import com.example.backend.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service implementation for common authentication operations
 * Registration is now handled by specific services (AdminService, SupplierService, CustomerService)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final KeycloakService keycloakService;
    private final UserRepository userRepository;
    private final OtpService otpService;
    private final com.example.backend.repository.AdminRepository adminRepository;
    private final com.example.backend.repository.SupplierRepository supplierRepository;
    private final com.example.backend.repository.PasswordResetTokenRepository passwordResetTokenRepository;
    private final com.example.backend.service.EmailService emailService;

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        log.info("User login attempt: {}", request.getUsername());

        try {
            // ===== STEP 1: Find user in database FIRST (to prevent race condition) =====
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

            // ===== STEP 2: Check if user is active =====
            if (!user.isActive()) {
                log.warn("Login attempt for inactive user: {}", request.getUsername());
                throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE);
            }

            // ===== STEP 3: Check account status based on user type =====
            if (user instanceof Customer customer) {
                if (customer.getStatus() == CustomerStatus.PENDING_VERIFICATION) {
                    log.warn("Login attempt for unverified customer: {}", request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_NOT_VERIFIED);
                }
                if (customer.getStatus() != CustomerStatus.ACTIVE) {
                    log.warn("Login attempt for customer with status {}: {}", customer.getStatus(), request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE);
                }
            } else if (user instanceof Supplier supplier) {
                if (supplier.getStatus() == SupplierStatus.PENDING_VERIFICATION ||
                        supplier.getStatus() == SupplierStatus.PENDING_DOCUMENTS ||
                        supplier.getStatus() == SupplierStatus.PENDING_STORE_INFO ||
                        supplier.getStatus() == SupplierStatus.PENDING_APPROVAL) {
                    log.warn("Login attempt for pending supplier ({}): {}", supplier.getStatus(), request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_PENDING_APPROVAL);
                }
                if (supplier.getStatus() == SupplierStatus.SUSPENDED) {
                    log.warn("Login attempt for suspended supplier: {}", request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_LOCKED);
                }
                if (supplier.getStatus() == SupplierStatus.REJECTED) {
                    log.warn("Login attempt for rejected supplier: {}", request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_REJECTED);
                }
                if (supplier.getStatus() != SupplierStatus.ACTIVE && supplier.getStatus() != SupplierStatus.PAUSE) {
                    log.warn("Login attempt for supplier with status {}: {}", supplier.getStatus(), request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE);
                }
            } else if (user instanceof Admin admin) {
                if (admin.getStatus() == AdminStatus.PENDING_APPROVAL) {
                    log.warn("Login attempt for pending admin: {}", request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_PENDING_APPROVAL);
                }
                if (admin.getStatus() != AdminStatus.ACTIVE) {
                    log.warn("Login attempt for admin with status {}: {}", admin.getStatus(), request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE);
                }
            }

            // ===== STEP 4: Authenticate with Keycloak (only after all checks pass) =====
            Map<String, Object> tokenResponse = keycloakService.authenticateUser(request);

            // ===== STEP 5: Decode access token to get JWT =====
            String accessToken = (String) tokenResponse.get("access_token");
            org.springframework.security.oauth2.jwt.Jwt jwt = null;
            try {
                jwt = JwtUtils.decodeToken(accessToken);
                log.info("JWT decoded successfully for user: {}", request.getUsername());
            } catch (Exception e) {
                log.warn("Failed to decode JWT token for user: {}, will use fallback", request.getUsername(), e);
            }

            // ===== STEP 6: Get user info with JWT (includes roles from token) =====
            UserInfoResponse userInfo = getUserInfo(user.getKeycloakId(), jwt);

            // ===== STEP 7: Build login response =====
            LoginResponse response = LoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken((String) tokenResponse.get("refresh_token"))
                    .tokenType((String) tokenResponse.get("token_type"))
                    .expiresIn((Integer) tokenResponse.get("expires_in"))
                    .refreshExpiresIn((Integer) tokenResponse.get("refresh_expires_in"))
                    .scope((String) tokenResponse.get("scope"))
                    .userInfo(userInfo)
                    .build();

            log.info("User logged in successfully: {}", request.getUsername());
            return response;

        } catch (UnauthorizedException | NotFoundException e) {
            // Re-throw our custom exceptions
            throw e;
        } catch (Exception e) {
            log.error("Login failed for user: {}", request.getUsername(), e);
            throw e;
        }
    }

    @Override
    public UserInfoResponse getUserInfo(String keycloakId, org.springframework.security.oauth2.jwt.Jwt jwt) {
        log.info("Getting basic user info for keycloakId: {}", keycloakId);

        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Extract roles from JWT
        List<String> roles = jwt != null
                ? JwtUtils.extractRoles(jwt, "backend-fs")
                : new ArrayList<>();

        log.info("Roles extracted from JWT for user {}: {}", user.getUsername(), roles);

        // Build basic user info
        UserInfoResponse.UserInfoResponseBuilder builder = UserInfoResponse.builder()
                .userId(user.getUserId())
                .keycloakId(user.getKeycloakId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .active(user.isActive())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt());

        // Add user type and status
        if (user instanceof Customer customer) {
            builder.userType("CUSTOMER")
                    .status(customer.getStatus().name());
        } else if (user instanceof Supplier supplier) {
            builder.userType("SUPPLIER")
                    .status(supplier.getStatus().name());
        } else if (user instanceof Admin admin) {
            builder.userType("ADMIN")
                    .status(admin.getStatus().name());
        }

        return builder.build();
    }

    @Override
    public LoginResponse refreshToken(String refreshToken) {
        log.info("Refreshing access token");

        try {
            // Refresh token with Keycloak
            Map<String, Object> tokenResponse = keycloakService.refreshAccessToken(refreshToken);

            // Build response
            return LoginResponse.builder()
                    .accessToken((String) tokenResponse.get("access_token"))
                    .refreshToken((String) tokenResponse.get("refresh_token"))
                    .tokenType((String) tokenResponse.get("token_type"))
                    .expiresIn((Integer) tokenResponse.get("expires_in"))
                    .refreshExpiresIn((Integer) tokenResponse.get("refresh_expires_in"))
                    .scope((String) tokenResponse.get("scope"))
                    .build();

        } catch (Exception e) {
            log.error("Failed to refresh token", e);
            throw e;
        }
    }

    @Override
    public void logout(String refreshToken) {
        log.info("Logging out user");

        try {
            keycloakService.revokeToken(refreshToken);
            log.info("User logged out successfully");
        } catch (Exception e) {
            log.error("Error during logout", e);
            // Don't throw exception, logout should always succeed
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String requestCustomerLoginOtp(String phoneNumber) {
        log.info("Customer requesting login OTP for phone: {}", phoneNumber);

        // Find customer by phone number
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check if user is customer
        if (!(user instanceof Customer customer)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "This phone number is not registered as a customer");
        }

        // Check if customer is active
        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE);
        }

        // Send OTP via SMS
        try {
            otpService.sendOtp(phoneNumber);
            log.info("OTP sent to phone: {}", phoneNumber);
            return "OTP has been sent to your phone number";
        } catch (Exception e) {
            log.error("Failed to send OTP to phone: {}", phoneNumber, e);
            throw new BadRequestException(ErrorCode.SMS_SEND_FAILED);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse verifyCustomerLoginOtp(String phoneNumber, String otp) {
        log.info("Customer verifying login OTP for phone: {}", phoneNumber);

        // Find customer by phone number
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check if user is customer
        if (!(user instanceof Customer customer)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "This phone number is not registered as a customer");
        }

        // Check if customer is active
        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE);
        }

        // Verify OTP
        boolean isValid = otpService.verifyOtp(phoneNumber, otp);
        if (!isValid) {
            throw new BadRequestException(ErrorCode.INVALID_OTP);
        }

        log.info("OTP verified successfully for phone: {}", phoneNumber);

        // Create a temporary password for this login session
        String tempPassword = UUID.randomUUID().toString();
        
        // Update password in Keycloak
        try {
            keycloakService.updateUserPassword(customer.getKeycloakId(), tempPassword);
        } catch (Exception e) {
            log.error("Failed to update temp password for customer: {}", customer.getUsername(), e);
            throw new BadRequestException(ErrorCode.KEYCLOAK_PASSWORD_UPDATE_FAILED);
        }

        // Now login with username and temp password
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(customer.getUsername());
        loginRequest.setPassword(tempPassword);

        try {
            Map<String, Object> tokenResponse = keycloakService.authenticateUser(loginRequest);

            return LoginResponse.builder()
                    .userId(customer.getUserId())
                    .username(customer.getUsername())
                    .email(customer.getEmail())
                    .phoneNumber(customer.getPhoneNumber())
                    .fullName(customer.getFullName())
                    .avatarUrl(customer.getAvatarUrl())
                    .userType("customer")
                    .accessToken((String) tokenResponse.get("access_token"))
                    .refreshToken((String) tokenResponse.get("refresh_token"))
                    .tokenType((String) tokenResponse.get("token_type"))
                    .expiresIn((Integer) tokenResponse.get("expires_in"))
                    .refreshExpiresIn((Integer) tokenResponse.get("refresh_expires_in"))
                    .scope((String) tokenResponse.get("scope"))
                    .build();

        } catch (Exception e) {
            log.error("Failed to authenticate customer after OTP verification", e);
            throw new UnauthorizedException(ErrorCode.KEYCLOAK_AUTHENTICATION_FAILED);
        }
    }

    @Override
    @Transactional
    public com.example.backend.dto.response.ResetPasswordResponse requestPasswordReset(String email, String userType) {
        log.info("Password reset requested for email: {}, userType: {}", email, userType);

        // Validate userType
        if (!userType.equalsIgnoreCase("ADMIN") && !userType.equalsIgnoreCase("SUPPLIER")) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "User type must be either ADMIN or SUPPLIER");
        }

        // Find user by email based on userType
        String keycloakId;
        String fullName;

        if (userType.equalsIgnoreCase("ADMIN")) {
            Admin admin = adminRepository.findByEmail(email)
                    .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND, "Admin not found with email: " + email));

            // Check if admin is active
            if (admin.getStatus() != AdminStatus.ACTIVE) {
                throw new BadRequestException(ErrorCode.ACCOUNT_INACTIVE, "Cannot reset password for inactive account");
            }

            keycloakId = admin.getKeycloakId();
            fullName = admin.getFullName();

        } else { // SUPPLIER
            Supplier supplier = supplierRepository.findByEmail(email)
                    .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND, "Supplier not found with email: " + email));

            // Check if supplier is active
            if (supplier.getStatus() != SupplierStatus.ACTIVE && supplier.getStatus() != SupplierStatus.PAUSE) {
                throw new BadRequestException(ErrorCode.ACCOUNT_INACTIVE, "Cannot reset password for inactive account");
            }

            keycloakId = supplier.getKeycloakId();
            fullName = supplier.getFullName();
        }

        // Invalidate any existing valid tokens for this user
        passwordResetTokenRepository.invalidateAllTokensForUser(keycloakId, java.time.LocalDateTime.now());

        // Generate unique token (UUID)
        String resetToken = UUID.randomUUID().toString();

        // Create token entity with 1 hour expiry
        com.example.backend.entity.PasswordResetToken tokenEntity = new com.example.backend.entity.PasswordResetToken();
        tokenEntity.setToken(resetToken);
        tokenEntity.setKeycloakId(keycloakId);
        tokenEntity.setUserType(userType.toUpperCase());
        tokenEntity.setEmail(email);
        tokenEntity.setExpiryDate(java.time.LocalDateTime.now().plusHours(1));

        passwordResetTokenRepository.save(tokenEntity);

        // Send email with reset link
        try {
            emailService.sendPasswordResetEmail(email, fullName, resetToken);
            log.info("Password reset email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", email, e);
            // Don't throw exception, token is already created
        }

        return com.example.backend.dto.response.ResetPasswordResponse.builder()
                .success(true)
                .message("Password reset email has been sent. Please check your inbox.")
                .email(email)
                .expiryDate(tokenEntity.getExpiryDate())
                .userType(userType.toUpperCase())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public com.example.backend.dto.response.ResetPasswordResponse validateResetToken(String token) {
        log.info("Validating reset token: {}", token);

        // Find token
        com.example.backend.entity.PasswordResetToken tokenEntity = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException(ErrorCode.INVALID_TOKEN, "Invalid or expired reset token"));

        // Check if token is valid (not used and not expired)
        if (!tokenEntity.isValid()) {
            if (tokenEntity.isUsed()) {
                throw new BadRequestException(ErrorCode.TOKEN_ALREADY_USED, "This reset token has already been used");
            } else {
                throw new BadRequestException(ErrorCode.TOKEN_EXPIRED, "This reset token has expired. Please request a new one.");
            }
        }

        return com.example.backend.dto.response.ResetPasswordResponse.builder()
                .success(true)
                .message("Token is valid")
                .email(tokenEntity.getEmail())
                .expiryDate(tokenEntity.getExpiryDate())
                .userType(tokenEntity.getUserType())
                .build();
    }

    @Override
    @Transactional
    public com.example.backend.dto.response.ResetPasswordResponse resetPassword(String token, String newPassword, String confirmPassword) {
        log.info("Resetting password with token: {}", token);

        // Check if passwords match
        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException(ErrorCode.PASSWORD_MISMATCH, "Passwords do not match");
        }

        // Find and validate token
        com.example.backend.entity.PasswordResetToken tokenEntity = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException(ErrorCode.INVALID_TOKEN, "Invalid or expired reset token"));

        // Check if token is valid
        if (!tokenEntity.isValid()) {
            if (tokenEntity.isUsed()) {
                throw new BadRequestException(ErrorCode.TOKEN_ALREADY_USED, "This reset token has already been used");
            } else {
                throw new BadRequestException(ErrorCode.TOKEN_EXPIRED, "This reset token has expired. Please request a new one.");
            }
        }

        // Update password in Keycloak
        try {
            keycloakService.updateUserPassword(tokenEntity.getKeycloakId(), newPassword);
            log.info("Password updated successfully in Keycloak for user: {}", tokenEntity.getEmail());
        } catch (Exception e) {
            log.error("Failed to update password in Keycloak for user: {}", tokenEntity.getEmail(), e);
            throw new BadRequestException(ErrorCode.KEYCLOAK_PASSWORD_UPDATE_FAILED, "Failed to update password. Please try again.");
        }

        // Mark token as used
        tokenEntity.markAsUsed();
        passwordResetTokenRepository.save(tokenEntity);

        log.info("Password reset successful for user: {}", tokenEntity.getEmail());

        return com.example.backend.dto.response.ResetPasswordResponse.builder()
                .success(true)
                .message("Password has been reset successfully. You can now login with your new password.")
                .email(tokenEntity.getEmail())
                .userType(tokenEntity.getUserType())
                .build();
    }
}
