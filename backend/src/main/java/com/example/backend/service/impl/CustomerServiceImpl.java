package com.example.backend.service.impl;

import com.example.backend.dto.request.CustomerUpdateRequest;
import com.example.backend.dto.request.PhoneAuthStep1Request;
import com.example.backend.dto.request.PhoneAuthStep2Request;
import com.example.backend.dto.response.CustomerResponse;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.PhoneAuthStep1Response;
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
    public PhoneAuthStep1Response phoneAuthStep1(PhoneAuthStep1Request request) {
        String phoneNumber = request.getPhoneNumber();
        log.info("Phone Auth Step 1: Processing phone number: {}", phoneNumber);
        
        // Check if customer exists
        boolean isExistingCustomer = userRepository.existsByPhoneNumber(phoneNumber);
        String accountStatus;
        
        if (!isExistingCustomer) {
            // Auto-create new customer account (only in DB, Keycloak user created after OTP verification)
            log.info("Phone number not found, will create customer account after OTP verification");
            
            // Generate random username: user_xxxxxxxx
            String randomUsername = "user_" + UUID.randomUUID().toString().substring(0, 8);
            while (userRepository.existsByUsername(randomUsername)) {
                randomUsername = "user_" + UUID.randomUUID().toString().substring(0, 8);
            }
            
            // Create customer with PENDING_VERIFICATION status (no keycloakId yet)
            Customer customer = new Customer();
            customer.setUsername(randomUsername);
            customer.setPhoneNumber(phoneNumber);
            customer.setStatus(CustomerStatus.PENDING_VERIFICATION);
            customer.setActive(false);
            customer.setAvatarUrl("https://res.cloudinary.com/dk7coitah/image/upload/v1760668372/avatar_cflwdp.jpg");
            
            customerRepository.save(customer);
            log.info("New customer created in DB: userId={}, username={} (Keycloak user will be created after OTP)", 
                    customer.getUserId(), customer.getUsername());
            accountStatus = "NEW";
        } else {
            log.info("Existing customer found for phone: {}", phoneNumber);
            accountStatus = "EXISTING";
        }
        
        // Send OTP (both new and existing customers)
        try {
            otpService.sendOtp(phoneNumber);
            log.info("OTP sent successfully to: {}", phoneNumber);
        } catch (Exception e) {
            log.error("Failed to send OTP to: {}", phoneNumber, e);
            throw new BadRequestException(ErrorCode.SMS_SEND_FAILED);
        }
        
        return PhoneAuthStep1Response.builder()
                .phoneNumber(phoneNumber)
                .accountStatus(accountStatus)
                .message("Mã OTP đã được gửi đến số điện thoại của bạn")
                .expirySeconds(300) // 5 minutes
                .build();
    }
    
    @Override
    @Transactional
    public LoginResponse phoneAuthStep2(PhoneAuthStep2Request request) {
        String phoneNumber = request.getPhoneNumber();
        String otp = request.getOtp();
        log.info("Phone Auth Step 2: Processing login/registration for phone: {}", phoneNumber);
        LoginResponse loginResponse = authService.verifyCustomerLoginOtp(phoneNumber, otp);

        log.info("Phone authentication completed successfully for phone: {}", phoneNumber);

        return loginResponse;
    }

    @Override
    public CustomerResponse getCustomerInfo(String userId) {
        log.info("Getting customer info by userId: {}", userId);

        Customer customer = customerRepository.findById(userId)
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
    public CustomerResponse updateProfile(String userId, CustomerUpdateRequest request) {
        log.info("Updating customer profile for userId: {}", userId);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Update customer fields (null-safe)
        if (request.getFullName() != null) {
            customer.setFullName(request.getFullName());
        }
        if (request.getEmail() != null) {
            // Check if email is already used by another user
            if (userRepository.existsByEmail(request.getEmail()) &&
                !request.getEmail().equals(customer.getEmail())) {
                throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
            customer.setEmail(request.getEmail());
        }
        if (request.getDateOfBirth() != null) {
            customer.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getAvatarUrl() != null) {
            customer.setAvatarUrl(request.getAvatarUrl());
        }

        customer = customerRepository.save(customer);

        log.info("Customer profile updated successfully for userId: {}", customer.getUserId());
        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse setActive(String userId, boolean active) {
        log.info("Setting customer active status: userId={}, active={}", userId, active);

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        CustomerStatus currentStatus = customer.getStatus();
        customer.setActive(active);

        // Sync status with active flag, respecting status hierarchy
        if (active) {
            // When enabling, only allow activation for non-permanent states
            // NEVER automatically reactivate BANNED customers
            if (currentStatus == CustomerStatus.BANNED) {
                log.warn("Cannot auto-activate BANNED customer {}. Requires explicit unban.", userId);
                // Keep as BANNED, but set active=true for consistency
                // Admin must explicitly unban to change status
            } else if (currentStatus == CustomerStatus.PENDING_VERIFICATION) {
                // Keep as PENDING_VERIFICATION until they complete verification
                log.info("Keeping customer {} in PENDING_VERIFICATION status", userId);
            } else if (currentStatus == CustomerStatus.RESTRICTED) {
                // Keep as RESTRICTED - this is a special limited state
                // Requires explicit action to remove restriction
                log.info("Keeping customer {} in RESTRICTED status", userId);
            } else {
                // SUSPENDED, INACTIVE, ACTIVE → set to ACTIVE
                customer.setStatus(CustomerStatus.ACTIVE);
            }
        } else {
            // When disabling, respect severity hierarchy
            // NEVER downgrade a more severe status to a less severe one
            if (currentStatus == CustomerStatus.BANNED) {
                // BANNED is permanent - don't downgrade to SUSPENDED
                log.warn("Customer {} is BANNED - not downgrading to SUSPENDED", userId);
                // Keep as BANNED
            } else if (currentStatus == CustomerStatus.SUSPENDED) {
                // Already suspended - no change needed
                log.info("Customer {} is already SUSPENDED", userId);
            } else if (currentStatus == CustomerStatus.RESTRICTED) {
                // RESTRICTED is a special state - don't change to SUSPENDED
                // unless explicitly required by business logic
                log.info("Customer {} is RESTRICTED - not changing to SUSPENDED", userId);
                // Keep as RESTRICTED
            } else {
                // ACTIVE, INACTIVE, PENDING_VERIFICATION → set to SUSPENDED
                customer.setStatus(CustomerStatus.SUSPENDED);
            }
        }

        customer = customerRepository.save(customer);

        log.info("Customer active status updated: userId={}, active={}, previousStatus={}, newStatus={}",
                userId, active, currentStatus, customer.getStatus());
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
