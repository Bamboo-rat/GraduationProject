package com.example.backend.service.impl;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.response.*;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.AdminStatus;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.SupplierStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.exception.custom.UnauthorizedException;
import com.example.backend.repository.AdminRepository;
import com.example.backend.repository.PasswordResetTokenRepository;
import com.example.backend.repository.SupplierRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.*;
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
    private final AdminRepository adminRepository;
    private final SupplierRepository supplierRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final JwtTokenService jwtTokenService;

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
    @Transactional
    public LoginResponse verifyCustomerLoginOtp(String phoneNumber, String otp) {
        log.info("Processing customer phone authentication for: {}", phoneNumber);

        // Find customer by phone number
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Ensure user is a customer
        if (!(user instanceof Customer customer)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "This phone number is not registered as a customer");
        }

        // Verify OTP (single verification point)
        boolean isValid = otpService.verifyOtp(phoneNumber, otp);
        if (!isValid) {
            throw new BadRequestException(ErrorCode.INVALID_OTP);
        }
        log.info("OTP verified successfully for phone: {}", phoneNumber);

        // Activate customer if this is first-time registration
        if (customer.getStatus() == CustomerStatus.PENDING_VERIFICATION) {
            log.info("New customer registration detected - activating account: {}", customer.getUsername());
            customer.setStatus(CustomerStatus.ACTIVE);
            customer.setActive(true);
            userRepository.save(customer);
            log.info("Customer activated successfully: userId={}", customer.getUserId());
        } else if (customer.getStatus() != CustomerStatus.ACTIVE) {
            // Customer exists but is not active (suspended, etc.)
            log.warn("Login attempt for inactive customer: {}", customer.getUsername());
            throw new UnauthorizedException(ErrorCode.ACCOUNT_INACTIVE);
        }

        // Generate custom JWT tokens (no Keycloak needed for customers)
        String accessToken = jwtTokenService.generateCustomerAccessToken(customer);
        String refreshToken = jwtTokenService.generateCustomerRefreshToken(customer);

        log.info("Customer authentication successful: {}", customer.getUsername());

        // Build login response with custom tokens
        return LoginResponse.builder()
                .userId(customer.getUserId())
                .username(customer.getUsername())
                .email(customer.getEmail())
                .phoneNumber(customer.getPhoneNumber())
                .fullName(customer.getFullName())
                .avatarUrl(customer.getAvatarUrl())
                .userType("customer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600) // 1 hour in seconds
                .refreshExpiresIn(604800) // 7 days in seconds
                .build();
    }

    @Override
    @Transactional
    public ResetPasswordResponse requestPasswordReset(String email, String userType) {
        log.info("Step 1: Password reset OTP requested for email: {}, userType: {}", email, userType);

        // Validate userType
        if (!userType.equalsIgnoreCase("ADMIN") && !userType.equalsIgnoreCase("SUPPLIER")) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "User type must be either ADMIN or SUPPLIER");
        }

        // Find user by email based on userType to validate existence
        if (userType.equalsIgnoreCase("ADMIN")) {
            Admin admin = adminRepository.findByEmail(email)
                    .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND, "Admin not found with email: " + email));

            // Check if admin is active
            if (admin.getStatus() != AdminStatus.ACTIVE) {
                throw new BadRequestException(ErrorCode.ACCOUNT_INACTIVE, "Cannot reset password for inactive account");
            }

        } else { // SUPPLIER
            Supplier supplier = supplierRepository.findByEmail(email)
                    .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND, "Supplier not found with email: " + email));

            // Check if supplier is active
            if (supplier.getStatus() != SupplierStatus.ACTIVE && supplier.getStatus() != SupplierStatus.PAUSE) {
                throw new BadRequestException(ErrorCode.ACCOUNT_INACTIVE, "Cannot reset password for inactive account");
            }
        }

        // Send OTP to email (via OtpService)
        otpService.sendPasswordResetOtp(email);
        log.info("Password reset OTP sent successfully to: {}", email);

        return ResetPasswordResponse.builder()
                .success(true)
                .message("A 6-digit OTP has been sent to your email. Please check your inbox.")
                .email(email)
                .userType(userType.toUpperCase())
                .build();
    }

    @Override
    @Transactional
    public ResetPasswordResponse verifyResetOtp(String email, String otp) {
        log.info("Step 2: Verifying reset OTP for email: {}", email);

        // Verify OTP from Redis
        boolean isValid = otpService.verifyPasswordResetOtp(email, otp);
        if (!isValid) {
            throw new BadRequestException(ErrorCode.INVALID_OTP, "Invalid or expired OTP");
        }

        // Find user to get keycloakId and userType
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        String keycloakId = user.getKeycloakId();
        String userType;

        if (user instanceof Admin) {
            userType = "ADMIN";
        } else if (user instanceof Supplier) {
            userType = "SUPPLIER";
        } else {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Only ADMIN and SUPPLIER can reset password");
        }

        // Consume OTP (delete from Redis)
        otpService.consumePasswordResetOtp(email);

        // Invalidate any existing valid tokens for this user
        passwordResetTokenRepository.invalidateAllTokensForUser(keycloakId, java.time.LocalDateTime.now());

        // Generate temporary reset token (UUID) valid for 10 minutes
        String resetToken = UUID.randomUUID().toString();

        // Create token entity with 10-minute expiry
        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setToken(resetToken);
        tokenEntity.setKeycloakId(keycloakId);
        tokenEntity.setUserType(userType);
        tokenEntity.setEmail(email);
        tokenEntity.setExpiryDate(java.time.LocalDateTime.now().plusMinutes(10));

        passwordResetTokenRepository.save(tokenEntity);
        log.info("Temporary reset token generated for user: {}", email);

        return com.example.backend.dto.response.ResetPasswordResponse.builder()
                .success(true)
                .message("OTP verified successfully. Use the reset token to update your password.")
                .resetToken(resetToken)
                .email(email)
                .expiryDate(tokenEntity.getExpiryDate())
                .userType(userType)
                .build();
    }

    @Override
    @Transactional
    public ResetPasswordResponse resetPassword(String token, String newPassword, String confirmPassword) {
        log.info("Resetting password with token: {}", token);

        // Check if passwords match
        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException(ErrorCode.PASSWORD_MISMATCH, "Passwords do not match");
        }

        // Find and validate token
        PasswordResetToken tokenEntity = passwordResetTokenRepository.findByToken(token)
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

        return ResetPasswordResponse.builder()
                .success(true)
                .message("Password has been reset successfully. You can now login with your new password.")
                .email(tokenEntity.getEmail())
                .userType(tokenEntity.getUserType())
                .build();
    }
}
