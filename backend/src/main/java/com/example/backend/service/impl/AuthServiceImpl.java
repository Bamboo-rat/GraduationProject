package com.example.backend.service.impl;

import com.example.backend.dto.request.AdminRegisterRequest;
import com.example.backend.dto.request.CustomerRegisterRequest;
import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.SupplierRegisterRequest;
import com.example.backend.dto.response.*;
import com.example.backend.entity.Admin;
import com.example.backend.entity.Customer;
import com.example.backend.entity.EmailVerificationToken;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.AdminStatus;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.SupplierStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.exception.custom.UnauthorizedException;
import com.example.backend.mapper.AdminMapper;
import com.example.backend.mapper.CustomerMapper;
import com.example.backend.mapper.SupplierMapper;
import com.example.backend.repository.AdminRepository;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.EmailVerificationTokenRepository;
import com.example.backend.repository.SupplierRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AuthService;
import com.example.backend.service.EmailService;
import com.example.backend.service.KeycloakService;
import com.example.backend.utils.JwtUtils;
import com.example.backend.utils.ValidationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final KeycloakService keycloakService;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    
    // Mappers
    private final CustomerMapper customerMapper;
    private final SupplierMapper supplierMapper;
    private final AdminMapper adminMapper;

    @Override
    public RegisterResponse registerCustomer(CustomerRegisterRequest request) {
        log.info("Registering new customer: {}", request.getUsername());

        // ===== STEP 1: Validate business rules =====
        ValidationUtils.validateUsername(request.getUsername());
        ValidationUtils.validateEmail(request.getEmail());
        ValidationUtils.validatePassword(request.getPassword());
        ValidationUtils.validatePhoneNumber(request.getPhoneNumber());
        ValidationUtils.validateAge(request.getDateOfBirth());

        String keycloakId = null;

        try {
            // ===== STEP 2: Create user in Keycloak (outside transaction) =====
            String[] names = splitFullName(request.getFullName());
            keycloakId = keycloakService.createKeycloakUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    names[0],
                    names[1]
            );
            log.info("Keycloak user created successfully: {} with ID: {}", request.getUsername(), keycloakId);

            // ===== STEP 3: Assign customer role in Keycloak =====
            keycloakService.assignRoleToUser(keycloakId, "customer");
            log.info("Role 'customer' assigned successfully to user: {}", request.getUsername());

            // ===== STEP 4: Create customer in database (inside transaction) =====
            Customer customer = createCustomerInTransaction(request, keycloakId);

            log.info("Customer registered successfully: {} with ID: {}", request.getUsername(), customer.getUserId());

            return RegisterResponse.builder()
                    .userId(customer.getUserId())
                    .keycloakId(keycloakId)
                    .username(customer.getUsername())
                    .email(customer.getEmail())
                    .message("Customer registered successfully. Please check your email to verify your account.")
                    .status(CustomerStatus.PENDING_VERIFICATION.name())
                    .build();

        } catch (DataIntegrityViolationException e) {
            log.error("Database constraint violation for customer: {}", request.getUsername(), e);

            // Cleanup Keycloak user
            cleanupKeycloakUser(keycloakId, request.getUsername());

            // Determine which constraint was violated
            String errorMessage = e.getMessage().toLowerCase();
            if (errorMessage.contains("username")) {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
            } else if (errorMessage.contains("email")) {
                throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
            } else if (errorMessage.contains("phone")) {
                throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
            } else {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS); // Generic conflict
            }

        } catch (Exception e) {
            log.error("Error registering customer: {}", request.getUsername(), e);

            // Cleanup Keycloak user
            cleanupKeycloakUser(keycloakId, request.getUsername());

            throw e;
        }
    }

    @Transactional(rollbackFor = Exception.class)
    protected Customer createCustomerInTransaction(CustomerRegisterRequest request, String keycloakId) {
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

        try {
            customer = customerRepository.save(customer);
            log.info("Customer saved to database: {} with ID: {}", request.getUsername(), customer.getUserId());
        } catch (DataIntegrityViolationException e) {
            String message = e.getMessage().toLowerCase();
            log.error("DataIntegrityViolationException: {}", message);

            // Handle email conflict - allow re-registration if PENDING_VERIFICATION
            if (message.contains("email")) {
                Optional<Customer> existingCustomer = customerRepository.findByEmail(request.getEmail());
                
                if (existingCustomer.isPresent()) {
                    Customer existing = existingCustomer.get();
                    
                    // Allow re-registration if account is PENDING_VERIFICATION
                    if (existing.getStatus() == CustomerStatus.PENDING_VERIFICATION) {
                        log.info("Found pending account for email: {}. Deleting and allowing re-registration.", 
                                request.getEmail());
                        
                        // Delete old account from DB
                        customerRepository.delete(existing);
                        customerRepository.flush(); // Force delete immediately
                        
                        // Delete old verification tokens
                        emailVerificationTokenRepository.deleteByUser(existing);
                        
                        // Retry save with new data
                        customer = customerRepository.save(customer);
                        log.info("Customer re-registered successfully: {} with ID: {}", 
                                request.getUsername(), customer.getUserId());
                    } else {
                        // If ACTIVE or other status, throw conflict
                        throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
                    }
                } else {
                    throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
                }
            }
            // Handle username conflict
            else if (message.contains("username")) {
                Optional<User> existingUser = userRepository.findByUsername(request.getUsername());
                
                if (existingUser.isPresent() && existingUser.get() instanceof Customer) {
                    Customer existing = (Customer) existingUser.get();
                    
                    if (existing.getStatus() == CustomerStatus.PENDING_VERIFICATION) {
                        log.info("Found pending account for username: {}. Deleting and allowing re-registration.", 
                                request.getUsername());
                        
                        customerRepository.delete(existing);
                        customerRepository.flush();
                        emailVerificationTokenRepository.deleteByUser(existing);
                        
                        customer = customerRepository.save(customer);
                        log.info("Customer re-registered successfully: {} with ID: {}", 
                                request.getUsername(), customer.getUserId());
                    } else {
                        throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
                    }
                } else {
                    throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
                }
            }
            // Handle phone conflict
            else if (message.contains("phone")) {
                Optional<User> existingUser = userRepository.findByPhoneNumber(request.getPhoneNumber());
                
                if (existingUser.isPresent() && existingUser.get() instanceof Customer) {
                    Customer existing = (Customer) existingUser.get();
                    
                    if (existing.getStatus() == CustomerStatus.PENDING_VERIFICATION) {
                        log.info("Found pending account for phone: {}. Deleting and allowing re-registration.", 
                                request.getPhoneNumber());
                        
                        customerRepository.delete(existing);
                        customerRepository.flush();
                        emailVerificationTokenRepository.deleteByUser(existing);
                        
                        customer = customerRepository.save(customer);
                        log.info("Customer re-registered successfully: {} with ID: {}", 
                                request.getUsername(), customer.getUserId());
                    } else {
                        throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
                    }
                } else {
                    throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
                }
            } else {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS); // Generic conflict
            }
        }

        // Create email verification token
        String verificationToken = UUID.randomUUID().toString();
        EmailVerificationToken emailToken = new EmailVerificationToken();
        emailToken.setToken(verificationToken);
        emailToken.setUser(customer);
        emailToken.setExpiryDate(LocalDateTime.now().plusHours(24)); // Token valid for 24 hours
        emailToken.setUsed(false);

        emailVerificationTokenRepository.save(emailToken);
        log.info("Email verification token created for user: {}", request.getUsername());

        // Send verification email (async, don't fail transaction)
        try {
            emailService.sendVerificationEmail(
                    customer.getEmail(),
                    customer.getFullName(),
                    verificationToken
            );
            log.info("Verification email sent to: {}", customer.getEmail());
        } catch (Exception emailException) {
            // Don't fail registration if email fails, just log it
            log.error("Failed to send verification email to: {}", customer.getEmail(), emailException);
        }

        return customer;
    }

    private void cleanupKeycloakUser(String keycloakId, String username) {
        if (keycloakId != null) {
            try {
                log.warn("Cleaning up Keycloak user for: {}", username);
                keycloakService.deleteUser(keycloakId);
                log.info("Keycloak user deleted successfully");
            } catch (Exception cleanupException) {
                log.error("Failed to cleanup Keycloak user: {}", keycloakId, cleanupException);
            }
        }
    }

    @Override
    public RegisterResponse registerSupplier(SupplierRegisterRequest request) {
        log.info("Registering new supplier: {}", request.getUsername());

        // ===== STEP 1: Validate business rules =====
        ValidationUtils.validateUsername(request.getUsername());
        ValidationUtils.validateEmail(request.getEmail());
        ValidationUtils.validatePassword(request.getPassword());
        ValidationUtils.validatePhoneNumber(request.getPhoneNumber());

        String keycloakId = null;

        try {
            // ===== STEP 2: Create user in Keycloak (outside transaction) =====
            String[] names = splitFullName(request.getFullName());
            keycloakId = keycloakService.createKeycloakUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    names[0],
                    names[1]
            );
            log.info("Keycloak user created successfully: {} with ID: {}", request.getUsername(), keycloakId);

            // ===== STEP 3: Assign supplier role in Keycloak =====
            keycloakService.assignRoleToUser(keycloakId, "supplier");
            log.info("Role 'supplier' assigned successfully to user: {}", request.getUsername());

            // ===== STEP 4: Create supplier in database (inside transaction) =====
            Supplier supplier = createSupplierInTransaction(request, keycloakId);

            log.info("Supplier registered successfully: {} with ID: {}", request.getUsername(), supplier.getUserId());

            return RegisterResponse.builder()
                    .userId(supplier.getUserId())
                    .keycloakId(keycloakId)
                    .username(supplier.getUsername())
                    .email(supplier.getEmail())
                    .message("Supplier registered successfully. Your account is pending approval.")
                    .status(SupplierStatus.PENDING_APPROVAL.name())
                    .build();

        } catch (DataIntegrityViolationException e) {
            log.error("Database constraint violation for supplier: {}", request.getUsername(), e);

            // Cleanup Keycloak user
            cleanupKeycloakUser(keycloakId, request.getUsername());

            // Determine which constraint was violated
            String errorMessage = e.getMessage().toLowerCase();
            if (errorMessage.contains("username")) {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
            } else if (errorMessage.contains("email")) {
                throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
            } else if (errorMessage.contains("phone")) {
                throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
            } else if (errorMessage.contains("business_license")) {
                throw new ConflictException(ErrorCode.BUSINESS_LICENSE_ALREADY_EXISTS);
            } else if (errorMessage.contains("tax_code")) {
                throw new ConflictException(ErrorCode.TAX_CODE_ALREADY_EXISTS);
            } else {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS); // Generic conflict
            }

        } catch (Exception e) {
            log.error("Error registering supplier: {}", request.getUsername(), e);

            // Cleanup Keycloak user
            cleanupKeycloakUser(keycloakId, request.getUsername());

            throw e;
        }
    }

    @Transactional(rollbackFor = Exception.class)
    protected Supplier createSupplierInTransaction(SupplierRegisterRequest request, String keycloakId) {
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

        try {
            supplier = supplierRepository.save(supplier);
            log.info("Supplier saved to database: {} with ID: {}", request.getUsername(), supplier.getUserId());
        } catch (DataIntegrityViolationException e) {
            String message = e.getMessage().toLowerCase();
            log.error("DataIntegrityViolationException: {}", message);

            // Handle email conflict - allow re-registration if PENDING_APPROVAL
            if (message.contains("email")) {
                Optional<Supplier> existingSupplier = supplierRepository.findByEmail(request.getEmail());
                
                if (existingSupplier.isPresent()) {
                    Supplier existing = existingSupplier.get();
                    
                    // Allow re-registration if account is PENDING_APPROVAL
                    if (existing.getStatus() == SupplierStatus.PENDING_APPROVAL) {
                        log.info("Found pending supplier for email: {}. Deleting and allowing re-registration.", 
                                request.getEmail());
                        
                        supplierRepository.delete(existing);
                        supplierRepository.flush();
                        
                        supplier = supplierRepository.save(supplier);
                        log.info("Supplier re-registered successfully: {} with ID: {}", 
                                request.getUsername(), supplier.getUserId());
                    } else {
                        throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
                    }
                } else {
                    throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
                }
            }
            // Handle username conflict
            else if (message.contains("username")) {
                Optional<User> existingUser = userRepository.findByUsername(request.getUsername());
                
                if (existingUser.isPresent() && existingUser.get() instanceof Supplier) {
                    Supplier existing = (Supplier) existingUser.get();
                    
                    if (existing.getStatus() == SupplierStatus.PENDING_APPROVAL) {
                        log.info("Found pending supplier for username: {}. Deleting and allowing re-registration.", 
                                request.getUsername());
                        
                        supplierRepository.delete(existing);
                        supplierRepository.flush();
                        
                        supplier = supplierRepository.save(supplier);
                        log.info("Supplier re-registered successfully: {} with ID: {}", 
                                request.getUsername(), supplier.getUserId());
                    } else {
                        throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
                    }
                } else {
                    throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
                }
            }
            // Handle phone conflict
            else if (message.contains("phone")) {
                Optional<User> existingUser = userRepository.findByPhoneNumber(request.getPhoneNumber());
                
                if (existingUser.isPresent() && existingUser.get() instanceof Supplier) {
                    Supplier existing = (Supplier) existingUser.get();
                    
                    if (existing.getStatus() == SupplierStatus.PENDING_APPROVAL) {
                        log.info("Found pending supplier for phone: {}. Deleting and allowing re-registration.", 
                                request.getPhoneNumber());
                        
                        supplierRepository.delete(existing);
                        supplierRepository.flush();
                        
                        supplier = supplierRepository.save(supplier);
                        log.info("Supplier re-registered successfully: {} with ID: {}", 
                                request.getUsername(), supplier.getUserId());
                    } else {
                        throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
                    }
                } else {
                    throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
                }
            }
            // Handle business license conflict
            else if (message.contains("business_license")) {
                Optional<Supplier> existingSupplier = supplierRepository.findByBusinessLicense(request.getBusinessLicense());
                
                if (existingSupplier.isPresent()) {
                    Supplier existing = existingSupplier.get();
                    
                    if (existing.getStatus() == SupplierStatus.PENDING_APPROVAL) {
                        log.info("Found pending supplier for business license: {}. Deleting and allowing re-registration.", 
                                request.getBusinessLicense());
                        
                        supplierRepository.delete(existing);
                        supplierRepository.flush();
                        
                        supplier = supplierRepository.save(supplier);
                        log.info("Supplier re-registered successfully: {} with ID: {}", 
                                request.getUsername(), supplier.getUserId());
                    } else {
                        throw new ConflictException(ErrorCode.BUSINESS_LICENSE_ALREADY_EXISTS);
                    }
                } else {
                    throw new ConflictException(ErrorCode.BUSINESS_LICENSE_ALREADY_EXISTS);
                }
            }
            // Handle tax code conflict
            else if (message.contains("tax_code")) {
                Optional<Supplier> existingSupplier = supplierRepository.findByTaxCode(request.getTaxCode());
                
                if (existingSupplier.isPresent()) {
                    Supplier existing = existingSupplier.get();
                    
                    if (existing.getStatus() == SupplierStatus.PENDING_APPROVAL) {
                        log.info("Found pending supplier for tax code: {}. Deleting and allowing re-registration.", 
                                request.getTaxCode());
                        
                        supplierRepository.delete(existing);
                        supplierRepository.flush();
                        
                        supplier = supplierRepository.save(supplier);
                        log.info("Supplier re-registered successfully: {} with ID: {}", 
                                request.getUsername(), supplier.getUserId());
                    } else {
                        throw new ConflictException(ErrorCode.TAX_CODE_ALREADY_EXISTS);
                    }
                } else {
                    throw new ConflictException(ErrorCode.TAX_CODE_ALREADY_EXISTS);
                }
            } else {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS); // Generic conflict
            }
        }

        return supplier;
    }

    @Override
    public RegisterResponse registerAdmin(AdminRegisterRequest request) {
        log.info("Registering new admin/staff: {}", request.getUsername());

        // ===== STEP 1: Validate business rules =====
        ValidationUtils.validateUsername(request.getUsername());
        ValidationUtils.validateEmail(request.getEmail());
        ValidationUtils.validatePassword(request.getPassword());
        ValidationUtils.validatePhoneNumber(request.getPhoneNumber());

        String keycloakId = null;

        try {
            // ===== STEP 2: Create user in Keycloak (outside transaction) =====
            String[] names = splitFullName(request.getFullName());
            keycloakId = keycloakService.createKeycloakUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    names[0],
                    names[1]
            );
            log.info("Keycloak user created successfully: {} with ID: {}", request.getUsername(), keycloakId);

            // ===== STEP 3: Assign role in Keycloak =====
            String keycloakRoleName = toKeycloakRoleName(request.getRole().name());
            keycloakService.assignRoleToUser(keycloakId, keycloakRoleName);
            log.info("Role '{}' assigned successfully to user: {}", keycloakRoleName, request.getUsername());

            // ===== STEP 4: Create admin in database (inside transaction) =====
            Admin admin = createAdminInTransaction(request, keycloakId);

            log.info("Admin/staff registered successfully: {} with ID: {}", request.getUsername(), admin.getUserId());

            return RegisterResponse.builder()
                    .userId(admin.getUserId())
                    .keycloakId(keycloakId)
                    .username(admin.getUsername())
                    .email(admin.getEmail())
                    .message("Admin/staff registered successfully. Your account is pending approval.")
                    .status(AdminStatus.PENDING_APPROVAL.name())
                    .build();

        } catch (DataIntegrityViolationException e) {
            log.error("Database constraint violation for admin: {}", request.getUsername(), e);

            // Cleanup Keycloak user
            cleanupKeycloakUser(keycloakId, request.getUsername());

            // Determine which constraint was violated
            String errorMessage = e.getMessage().toLowerCase();
            if (errorMessage.contains("username")) {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
            } else if (errorMessage.contains("email")) {
                throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
            } else if (errorMessage.contains("phone")) {
                throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
            } else {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS); // Generic conflict
            }

        } catch (Exception e) {
            log.error("Error registering admin/staff: {}", request.getUsername(), e);

            // Cleanup Keycloak user
            cleanupKeycloakUser(keycloakId, request.getUsername());

            throw e;
        }
    }

    @Transactional(rollbackFor = Exception.class)
    protected Admin createAdminInTransaction(AdminRegisterRequest request, String keycloakId) {
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
        log.info("Admin saved to database: {} with ID: {}", request.getUsername(), admin.getUserId());

        return admin;
    }

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
                if (supplier.getStatus() == SupplierStatus.PENDING_APPROVAL) {
                    log.warn("Login attempt for pending supplier: {}", request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_PENDING_APPROVAL);
                }
                if (supplier.getStatus() == SupplierStatus.SUSPENDED) {
                    log.warn("Login attempt for suspended supplier: {}", request.getUsername());
                    throw new UnauthorizedException(ErrorCode.ACCOUNT_LOCKED);
                }
                if (supplier.getStatus() != SupplierStatus.ACTIVE) {
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
    public CustomerResponse getCustomerInfo(String keycloakId) {
        log.info("Getting detailed customer info for keycloakId: {}", keycloakId);

        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Customer customer)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "User is not a customer");
        }

        return customerMapper.toResponse(customer);
    }

    @Override
    public SupplierResponse getSupplierInfo(String keycloakId) {
        log.info("Getting detailed supplier info for keycloakId: {}", keycloakId);

        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Supplier supplier)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "User is not a supplier");
        }

        return supplierMapper.toResponse(supplier);
    }

    @Override
    public AdminResponse getAdminInfo(String keycloakId) {
        log.info("Getting detailed admin info for keycloakId: {}", keycloakId);

        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Admin admin)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "User is not an admin");
        }

        return adminMapper.toResponse(admin);
    }



    @Override
    @Transactional
    public String verifyEmail(String token) {
        log.info("Verifying email with token: {}", token);

        // Find token
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException(ErrorCode.VERIFICATION_TOKEN_INVALID));

        // Check if token is already used
        if (verificationToken.isUsed()) {
            throw new BadRequestException(ErrorCode.VERIFICATION_TOKEN_ALREADY_USED);
        }

        // Check if token is expired
        if (verificationToken.isExpired()) {
            throw new BadRequestException(ErrorCode.VERIFICATION_TOKEN_INVALID);
        }

        // Get user
        User user = verificationToken.getUser();

        // Check if user is a customer
        if (!(user instanceof Customer customer)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Email verification is only for customers");
        }

        // Check if already verified
        if (customer.getStatus() == CustomerStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        // Update customer status
        customer.setStatus(CustomerStatus.ACTIVE);
        customerRepository.save(customer);

        // Mark token as used
        verificationToken.setUsed(true);
        verificationToken.setVerifiedAt(LocalDateTime.now());
        emailVerificationTokenRepository.save(verificationToken);

        // Send welcome email
        try {
            emailService.sendWelcomeEmail(customer.getEmail(), customer.getFullName());
            log.info("Welcome email sent to: {}", customer.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", customer.getEmail(), e);
        }

        log.info("Email verified successfully for user: {}", customer.getUsername());

        return "Email verified successfully! You can now login to your account.";
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
    public String resendVerificationEmail(String email) {
        log.info("Resending verification email to: {}", email);

        // Find customer by email
        Customer customer = (Customer) userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check if user is a customer
        if (!(customer instanceof Customer)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Email verification is only for customers");
        }

        // Check if already verified
        if (customer.getStatus() == CustomerStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        // Find and invalidate old unused tokens for this user
        List<EmailVerificationToken> oldTokens = emailVerificationTokenRepository.findByUser(customer);
        for (EmailVerificationToken oldToken : oldTokens) {
            if (!oldToken.isUsed()) {
                oldToken.setUsed(true); // Mark as used to prevent reuse
                emailVerificationTokenRepository.save(oldToken);
            }
        }

        // Create new verification token
        String verificationToken = UUID.randomUUID().toString();
        EmailVerificationToken emailToken = new EmailVerificationToken();
        emailToken.setToken(verificationToken);
        emailToken.setUser(customer);
        emailToken.setExpiryDate(LocalDateTime.now().plusHours(24)); // Token valid for 24 hours
        emailToken.setUsed(false);

        emailVerificationTokenRepository.save(emailToken);
        log.info("New verification token created for user: {}", customer.getUsername());

        // Send verification email
        try {
            emailService.sendVerificationEmail(
                    customer.getEmail(),
                    customer.getFullName(),
                    verificationToken
            );
            log.info("Verification email resent to: {}", customer.getEmail());
            return "Verification email has been resent. Please check your inbox.";
        } catch (Exception e) {
            log.error("Failed to resend verification email to: {}", customer.getEmail(), e);
            throw new RuntimeException("Failed to send verification email. Please try again later.");
        }
    }

    private String[] splitFullName(String fullName) {
        String[] parts = fullName.trim().split("\\s+", 2);
        String firstName = parts[0];
        String lastName = parts.length > 1 ? parts[1] : "";
        return new String[]{firstName, lastName};
    }

    /**
     * Convert Role enum to Keycloak role name format
     * ROLE_SUPER_ADMIN -> super-admin
     * ROLE_STAFF -> staff
     */
    private String toKeycloakRoleName(String roleName) {
        return roleName.replace("ROLE_", "").toLowerCase().replace("_", "-");
    }
}
