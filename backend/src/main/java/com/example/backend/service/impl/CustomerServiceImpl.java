package com.example.backend.service.impl;

import com.example.backend.dto.request.CustomerUpdateRequest;
import com.example.backend.dto.request.CustomerRequest;
import com.example.backend.dto.response.CustomerResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.entity.Customer;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.CustomerMapper;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AuthService;
import com.example.backend.service.CustomerService;
import com.example.backend.service.KeycloakService;
import com.example.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Implementation of CustomerService
 * Handles 2-step customer registration via mobile app with SMS OTP
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {
    private final AuthService authService;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final KeycloakService keycloakService;
    private final OtpService otpService;
    private final CustomerMapper customerMapper;

    @Override
    @Transactional
    public RegisterResponse registerStep1(CustomerRequest request) {
        log.info("Step 1: Registering customer with phone: {}", request.getPhoneNumber());

        // Check if phone number already exists
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
        }

        // Generate random username: user_xxxxxxxx (8 random chars)
        String randomUsername = "user_" + UUID.randomUUID().toString().substring(0, 8);
        
        // Ensure username is unique
        while (userRepository.existsByUsername(randomUsername)) {
            randomUsername = "user_" + UUID.randomUUID().toString().substring(0, 8);
        }

        // Create customer in database with PENDING_VERIFICATION status
        Customer customer = new Customer();
        customer.setUsername(randomUsername);
        customer.setPhoneNumber(request.getPhoneNumber());
        customer.setStatus(CustomerStatus.PENDING_VERIFICATION);
        customer.setActive(false); // Not active until OTP verified
        customer.setAvatarUrl("https://res.cloudinary.com/dk7coitah/image/upload/v1760668372/avatar_cflwdp.jpg"); // Default avatar

        customer = customerRepository.save(customer);
        log.info("Customer created with userId: {}, username: {}, status: PENDING_VERIFICATION", 
                customer.getUserId(), customer.getUsername());

        // Send OTP via eSMS
        try {
            otpService.sendOtp(request.getPhoneNumber());
            log.info("OTP sent to phone: {}", request.getPhoneNumber());
        } catch (Exception e) {
            log.error("Failed to send OTP to phone: {}", request.getPhoneNumber(), e);
            // Rollback will happen due to @Transactional
            throw new BadRequestException(ErrorCode.SMS_SEND_FAILED);
        }

        return RegisterResponse.builder()
                .userId(customer.getUserId())
                .username(randomUsername)
                .phoneNumber(customer.getPhoneNumber())
                .message("OTP has been sent to your phone number. Please verify within 3 minutes.")
                .build();
    }

    @Override
    @Transactional
    public RegisterResponse verifyOtpStep2(String phoneNumber, String otp) {
        log.info("Step 2: Verifying OTP for phone: {}", phoneNumber);

        // Find customer by phone number
        Customer customer = customerRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check if customer is in PENDING_VERIFICATION status
        if (customer.getStatus() != CustomerStatus.PENDING_VERIFICATION) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST);
        }

        // Verify OTP
        boolean isValid = otpService.verifyOtp(phoneNumber, otp);
        if (!isValid) {
            throw new BadRequestException(ErrorCode.INVALID_OTP);
        }

        log.info("OTP verified successfully for phone: {}", phoneNumber);

        // Generate random password for Keycloak (user won't use this, just for system)
        String tempPassword = UUID.randomUUID().toString();

        String keycloakId = null;
        try {
            // Create user in Keycloak
            keycloakId = keycloakService.createKeycloakUser(
                    customer.getUsername(),
                    "", // No email yet
                    tempPassword,
                    "", // No firstName yet
                    "" // No lastName yet
            );

            // Assign 'customer' role in Keycloak
            keycloakService.assignRoleToUser(keycloakId, "customer");
            log.info("Keycloak user created with ID: {} and assigned 'customer' role", keycloakId);

            // Update customer status to ACTIVE
            customer.setKeycloakId(keycloakId);
            customer.setStatus(CustomerStatus.ACTIVE);
            customer.setActive(true);
            customer = customerRepository.save(customer);

            log.info("Customer activated: userId={}, keycloakId={}", customer.getUserId(), keycloakId);

            return RegisterResponse.builder()
                    .userId(customer.getUserId())
                    .keycloakId(keycloakId)
                    .username(customer.getUsername())
                    .phoneNumber(customer.getPhoneNumber())
                    .message("Registration completed successfully! You can now login with your phone number.")
                    .build();

        } catch (Exception e) {
            log.error("Failed to create Keycloak user or activate customer", e);
            
            // Cleanup: delete Keycloak user if it was created
            if (keycloakId != null) {
                try {
                    keycloakService.deleteUser(keycloakId);
                    log.info("Cleaned up Keycloak user: {}", keycloakId);
                } catch (Exception cleanupEx) {
                    log.error("Failed to cleanup Keycloak user: {}", keycloakId, cleanupEx);
                }
            }
            
            throw new BadRequestException(ErrorCode.KEYCLOAK_USER_CREATION_FAILED);
        }
    }

    @Override
    public String resendOtp(String phoneNumber) {
        log.info("Resending OTP to phone: {}", phoneNumber);

        // Check if customer exists and is in PENDING_VERIFICATION status
        Customer customer = customerRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (customer.getStatus() != CustomerStatus.PENDING_VERIFICATION) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST);
        }

        // Resend OTP via eSMS
        try {
            otpService.sendOtp(phoneNumber);
            log.info("OTP resent to phone: {}", phoneNumber);
            return "OTP has been resent to your phone number";
        } catch (Exception e) {
            log.error("Failed to resend OTP to phone: {}", phoneNumber, e);
            throw new BadRequestException(ErrorCode.SMS_SEND_FAILED);
        }
    }


    @Override
    public void sendLoginOtp(String phoneNumber) {
        authService.requestCustomerLoginOtp(phoneNumber);
    }

    @Override
    public com.example.backend.dto.response.LoginResponse verifyLoginOtpAndLogin(String phoneNumber, String otp) {
        return authService.verifyCustomerLoginOtp(phoneNumber, otp);
    }

    @Override
    public CustomerResponse getCustomerInfo(String keycloakId) {
        log.info("Getting customer info by keycloakId: {}", keycloakId);
        
        Customer customer = customerRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        return customerMapper.toResponse(customer);
    }

    @Override
    public CustomerResponse getCustomerById(String userId) {
        log.info("Getting customer by userId: {}", userId);
        
        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateProfile(String keycloakId, CustomerUpdateRequest request) {
        log.info("Updating customer profile for keycloakId: {}", keycloakId);

        Customer customer = customerRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        boolean needsKeycloakUpdate = false;
        String newEmail = null;
        String newFirstName = null;
        String newLastName = null;

        // Update customer fields (null-safe)
        if (request.getFullName() != null) {
            customer.setFullName(request.getFullName());
            // Split name for Keycloak
            String[] nameParts = request.getFullName().trim().split("\\s+", 2);
            newFirstName = nameParts[0];
            newLastName = nameParts.length > 1 ? nameParts[1] : "";
            needsKeycloakUpdate = true;
        }
        if (request.getEmail() != null) {
            // Check if email is already used by another user
            if (userRepository.existsByEmailAndKeycloakIdNot(request.getEmail(), keycloakId)) {
                throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
            customer.setEmail(request.getEmail());
            newEmail = request.getEmail();
            needsKeycloakUpdate = true;
        }
        if (request.getDateOfBirth() != null) {
            customer.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getAvatarUrl() != null) {
            customer.setAvatarUrl(request.getAvatarUrl());
        }

        customer = customerRepository.save(customer);

        // Update Keycloak if email or name changed
        if (needsKeycloakUpdate) {
            try {
                keycloakService.updateKeycloakUser(
                        keycloakId,
                        newEmail != null ? newEmail : customer.getEmail(),
                        newFirstName != null ? newFirstName : (customer.getFullName() != null ? customer.getFullName().split("\\s+")[0] : ""),
                        newLastName != null ? newLastName : ""
                );
                log.info("Keycloak user updated successfully for keycloakId: {}", keycloakId);
            } catch (Exception e) {
                log.error("Failed to update Keycloak user: {}", keycloakId, e);
                // Don't fail the operation, log the error
                // The database is already updated, Keycloak sync can be retried later
            }
        }

        log.info("Customer profile updated successfully for userId: {}", customer.getUserId());
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse setActive(String userId, boolean active) {
        log.info("Setting customer active status: userId={}, active={}", userId, active);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        customer.setActive(active);
        customer = customerRepository.save(customer);

        log.info("Customer active status updated: userId={}, active={}", userId, active);
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<CustomerResponse> getAllCustomers(
            int page,
            int size,
            com.example.backend.entity.enums.CustomerStatus status,
            com.example.backend.entity.enums.CustomerTier tier,
            String search,
            String sortBy,
            String sortDirection
    ) {
        log.info("Getting customers: page={}, size={}, status={}, tier={}, search={}",
                 page, size, status, tier, search);

        // Validate and set default sort
        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "createdAt";
        }
        if (sortDirection == null || sortDirection.isBlank()) {
            sortDirection = "DESC";
        }

        // Create pageable
        org.springframework.data.domain.Sort.Direction direction =
                sortDirection.equalsIgnoreCase("ASC") ?
                        org.springframework.data.domain.Sort.Direction.ASC :
                        org.springframework.data.domain.Sort.Direction.DESC;

        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(page, size,
                        org.springframework.data.domain.Sort.by(direction, sortBy));

        // Query with search and filter
        org.springframework.data.domain.Page<Customer> customersPage =
                customerRepository.findByStatusAndTierAndSearch(status, tier, search, pageable);

        // Map to response
        return customersPage.map(customerMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getCustomerStats() {
        log.info("Getting customer statistics");

        long totalCustomers = customerRepository.count();
        long activeCustomers = customerRepository.countByStatus(com.example.backend.entity.enums.CustomerStatus.ACTIVE);
        long pendingCustomers = customerRepository.countByStatus(com.example.backend.entity.enums.CustomerStatus.PENDING_VERIFICATION);
        long suspendedCustomers = customerRepository.countByStatus(com.example.backend.entity.enums.CustomerStatus.SUSPENDED);

        long bronzeCustomers = customerRepository.countByTier(com.example.backend.entity.enums.CustomerTier.BRONZE);
        long silverCustomers = customerRepository.countByTier(com.example.backend.entity.enums.CustomerTier.SILVER);
        long goldCustomers = customerRepository.countByTier(com.example.backend.entity.enums.CustomerTier.GOLD);
        long platinumCustomers = customerRepository.countByTier(com.example.backend.entity.enums.CustomerTier.PLATINUM);

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalCustomers", totalCustomers);
        stats.put("activeCustomers", activeCustomers);
        stats.put("pendingCustomers", pendingCustomers);
        stats.put("suspendedCustomers", suspendedCustomers);
        stats.put("bronzeCustomers", bronzeCustomers);
        stats.put("silverCustomers", silverCustomers);
        stats.put("goldCustomers", goldCustomers);
        stats.put("platinumCustomers", platinumCustomers);

        return stats;
    }
}
