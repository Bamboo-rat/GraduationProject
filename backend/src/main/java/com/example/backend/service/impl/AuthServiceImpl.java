package com.example.backend.service.impl;

import com.example.backend.dto.request.AdminRegisterRequest;
import com.example.backend.dto.request.CustomerRegisterRequest;
import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.SupplierRegisterRequest;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.dto.response.UserInfoResponse;
import com.example.backend.entity.Admin;
import com.example.backend.entity.Customer;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.AdminStatus;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.SupplierStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.AdminRepository;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.SupplierRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AuthService;
import com.example.backend.service.KeycloakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final KeycloakService keycloakService;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final AdminRepository adminRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public RegisterResponse registerCustomer(CustomerRegisterRequest request) {
        log.info("Registering new customer: {}", request.getUsername());

        // Validate uniqueness
        validateUserUniqueness(request.getUsername(), request.getEmail(), request.getPhoneNumber());

        String keycloakId = null;
        try {
            // Create user in Keycloak
            String[] names = splitFullName(request.getFullName());
            keycloakId = keycloakService.createKeycloakUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    names[0],
                    names[1]
            );

            // Assign customer role in Keycloak
            keycloakService.assignRoleToUser(keycloakId, "customer");

            // Create customer in database
            Customer customer = new Customer();
            customer.setKeycloakId(keycloakId);
            customer.setUsername(request.getUsername());
            customer.setEmail(request.getEmail());
            customer.setPhoneNumber(request.getPhoneNumber());
            customer.setFullName(request.getFullName());
            customer.setDateOfBirth(request.getDateOfBirth());
            customer.setStatus(CustomerStatus.PENDING_VERIFICATION);
            customer.setActive(true);

            customer = customerRepository.save(customer);

            log.info("Customer registered successfully: {} with ID: {}", request.getUsername(), customer.getUserId());

            return RegisterResponse.builder()
                    .userId(customer.getUserId())
                    .keycloakId(keycloakId)
                    .username(customer.getUsername())
                    .email(customer.getEmail())
                    .message("Customer registered successfully. Please verify your email.")
                    .status(CustomerStatus.PENDING_VERIFICATION.name())
                    .build();

        } catch (Exception e) {
            log.error("Error registering customer: {}", request.getUsername(), e);

            // Rollback: Delete user from Keycloak if database save failed
            if (keycloakId != null) {
                try {
                    log.warn("Rolling back Keycloak user creation for: {}", request.getUsername());
                    keycloakService.deleteUser(keycloakId);
                } catch (Exception rollbackException) {
                    log.error("Failed to rollback Keycloak user: {}", keycloakId, rollbackException);
                }
            }
            throw e;
        }
    }

    @Override
    @Transactional
    public RegisterResponse registerSupplier(SupplierRegisterRequest request) {
        log.info("Registering new supplier: {}", request.getUsername());

        // Validate uniqueness
        validateUserUniqueness(request.getUsername(), request.getEmail(), request.getPhoneNumber());
        validateSupplierUniqueness(request.getBusinessLicense(), request.getTaxCode());

        String keycloakId = null;
        try {
            // Create user in Keycloak
            String[] names = splitFullName(request.getFullName());
            keycloakId = keycloakService.createKeycloakUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    names[0],
                    names[1]
            );

            // Assign supplier role in Keycloak
            keycloakService.assignRoleToUser(keycloakId, "supplier");

            // Create supplier in database
            Supplier supplier = new Supplier();
            supplier.setKeycloakId(keycloakId);
            supplier.setUsername(request.getUsername());
            supplier.setEmail(request.getEmail());
            supplier.setPhoneNumber(request.getPhoneNumber());
            supplier.setFullName(request.getFullName());
            supplier.setBusinessName(request.getBusinessName());
            supplier.setBusinessLicense(request.getBusinessLicense());
            supplier.setTaxCode(request.getTaxCode());
            supplier.setStatus(SupplierStatus.PENDING_APPROVAL);
            supplier.setActive(true);

            supplier = supplierRepository.save(supplier);

            log.info("Supplier registered successfully: {} with ID: {}", request.getUsername(), supplier.getUserId());

            return RegisterResponse.builder()
                    .userId(supplier.getUserId())
                    .keycloakId(keycloakId)
                    .username(supplier.getUsername())
                    .email(supplier.getEmail())
                    .message("Supplier registered successfully. Your account is pending approval.")
                    .status(SupplierStatus.PENDING_APPROVAL.name())
                    .build();

        } catch (Exception e) {
            log.error("Error registering supplier: {}", request.getUsername(), e);

            // Rollback: Delete user from Keycloak if database save failed
            if (keycloakId != null) {
                try {
                    log.warn("Rolling back Keycloak user creation for: {}", request.getUsername());
                    keycloakService.deleteUser(keycloakId);
                } catch (Exception rollbackException) {
                    log.error("Failed to rollback Keycloak user: {}", keycloakId, rollbackException);
                }
            }
            throw e;
        }
    }

    @Override
    @Transactional
    public RegisterResponse registerAdmin(AdminRegisterRequest request) {
        log.info("Registering new admin/staff: {}", request.getUsername());

        // Validate uniqueness
        validateUserUniqueness(request.getUsername(), request.getEmail(), request.getPhoneNumber());

        String keycloakId = null;
        try {
            // Create user in Keycloak
            String[] names = splitFullName(request.getFullName());
            keycloakId = keycloakService.createKeycloakUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    names[0],
                    names[1]
            );

            // Assign staff role in Keycloak
            keycloakService.assignRoleToUser(keycloakId, "staff");

            // Create admin in database
            Admin admin = new Admin();
            admin.setKeycloakId(keycloakId);
            admin.setUsername(request.getUsername());
            admin.setEmail(request.getEmail());
            admin.setPhoneNumber(request.getPhoneNumber());
            admin.setFullName(request.getFullName());
            admin.setRole(request.getRole());
            admin.setStatus(AdminStatus.PENDING_APPROVAL);
            admin.setActive(true);

            admin = adminRepository.save(admin);

            log.info("Admin/staff registered successfully: {} with ID: {}", request.getUsername(), admin.getUserId());

            return RegisterResponse.builder()
                    .userId(admin.getUserId())
                    .keycloakId(keycloakId)
                    .username(admin.getUsername())
                    .email(admin.getEmail())
                    .message("Admin/staff registered successfully. Your account is pending approval.")
                    .status(AdminStatus.PENDING_APPROVAL.name())
                    .build();

        } catch (Exception e) {
            log.error("Error registering admin/staff: {}", request.getUsername(), e);

            // Rollback: Delete user from Keycloak if database save failed
            if (keycloakId != null) {
                try {
                    log.warn("Rolling back Keycloak user creation for: {}", request.getUsername());
                    keycloakService.deleteUser(keycloakId);
                } catch (Exception rollbackException) {
                    log.error("Failed to rollback Keycloak user: {}", keycloakId, rollbackException);
                }
            }
            throw e;
        }
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        log.info("User login attempt: {}", request.getUsername());

        try {
            // Authenticate with Keycloak
            Map<String, Object> tokenResponse = keycloakService.authenticateUser(request);

            // Find user in database
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

            // Get user info
            UserInfoResponse userInfo = getUserInfo(user.getKeycloakId());

            // Build login response
            return LoginResponse.builder()
                    .accessToken((String) tokenResponse.get("access_token"))
                    .refreshToken((String) tokenResponse.get("refresh_token"))
                    .tokenType((String) tokenResponse.get("token_type"))
                    .expiresIn((Integer) tokenResponse.get("expires_in"))
                    .refreshExpiresIn((Integer) tokenResponse.get("refresh_expires_in"))
                    .scope((String) tokenResponse.get("scope"))
                    .userInfo(userInfo)
                    .build();

        } catch (Exception e) {
            log.error("Login failed for user: {}", request.getUsername(), e);
            throw e;
        }
    }

    @Override
    public UserInfoResponse getUserInfo(String keycloakId) {
        log.info("Getting user info for keycloakId: {}", keycloakId);

        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        UserInfoResponse.UserInfoResponseBuilder builder = UserInfoResponse.builder()
                .userId(user.getUserId())
                .keycloakId(user.getKeycloakId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .active(user.isActive())
                .createdAt(user.getCreatedAt());

        List<String> roles = new ArrayList<>();

        if (user instanceof Customer customer) {
            builder.userType("customer")
                    .status(customer.getStatus().name())
                    .points(customer.getPoints())
                    .tier(customer.getTier().name())
                    .avatarUrl(customer.getAvatarUrl());
            roles.add("customer");
        } else if (user instanceof Supplier supplier) {
            builder.userType("supplier")
                    .status(supplier.getStatus().name())
                    .businessName(supplier.getBusinessName())
                    .logoUrl(supplier.getLogoUrl());
            roles.add("supplier");
        } else if (user instanceof Admin admin) {
            builder.userType("admin")
                    .status(admin.getStatus().name())
                    .adminRole(admin.getRole().name());
            roles.add("staff");
            roles.add(admin.getRole().name());
        }

        builder.roles(roles);

        return builder.build();
    }

    private void validateUserUniqueness(String username, String email, String phoneNumber) {
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (phoneNumber != null && userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
        }
    }

    private void validateSupplierUniqueness(String businessLicense, String taxCode) {
        if (supplierRepository.findByBusinessLicense(businessLicense).isPresent()) {
            throw new ConflictException(ErrorCode.BUSINESS_LICENSE_ALREADY_EXISTS);
        }
        if (supplierRepository.findByTaxCode(taxCode).isPresent()) {
            throw new ConflictException(ErrorCode.TAX_CODE_ALREADY_EXISTS);
        }
    }

    private String[] splitFullName(String fullName) {
        String[] parts = fullName.trim().split("\\s+", 2);
        String firstName = parts[0];
        String lastName = parts.length > 1 ? parts[1] : "";
        return new String[]{firstName, lastName};
    }
}
