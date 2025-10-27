package com.example.backend.service.impl;

import com.example.backend.dto.request.*;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.dto.response.SupplierResponse;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.Store;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.StoreStatus;
import com.example.backend.entity.enums.SupplierStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.SupplierMapper;
import com.example.backend.repository.SupplierRepository;
import com.example.backend.repository.StoreRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.InAppNotificationService;
import com.example.backend.service.KeycloakService;
import com.example.backend.service.NotificationService;
import com.example.backend.service.OtpService;
import com.example.backend.service.SupplierService;
import com.example.backend.service.WalletService;
import com.example.backend.entity.enums.EmailNotificationType;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.utils.ValidationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service implementation for Supplier management with 4-step registration
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final KeycloakService keycloakService;
    private final OtpService otpService;
    private final SupplierMapper supplierMapper;
    private final NotificationService notificationService;
    private final InAppNotificationService inAppNotificationService;
    private final WalletService walletService;

    // ========== 4-STEP REGISTRATION FLOW ==========

    @Override
    @Transactional
    public RegisterResponse registerStep1(SupplierRegisterStep1Request request) {
        log.info("Supplier registration Step 1: Creating account for {}", request.getUsername());

        // Validate
        ValidationUtils.validateUsername(request.getUsername());
        ValidationUtils.validateEmail(request.getEmail());
        ValidationUtils.validatePhoneNumber(request.getPhoneNumber());

        // Check if username already exists in local database
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        // Check if email already exists in local database
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // Check if phone number already exists in local database
        if (userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
            throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
        }

        String keycloakId = null;
        try {
            // Step 1: Create Keycloak user
            String[] names = splitFullName(request.getFullName());
            keycloakId = keycloakService.createKeycloakUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    names[0],
                    names[1]
            );
            keycloakService.assignRoleToUser(keycloakId, "supplier");
            log.info("Keycloak user created for supplier: {} with ID: {}", request.getUsername(), keycloakId);

            // Step 2: Create supplier in local database
            Supplier supplier = new Supplier();
            supplier.setUsername(request.getUsername());
            supplier.setEmail(request.getEmail());
            supplier.setPhoneNumber(request.getPhoneNumber());
            supplier.setFullName(request.getFullName());
            supplier.setKeycloakId(keycloakId);
            supplier.setStatus(SupplierStatus.PENDING_VERIFICATION);
            supplier.setActive(false);
            supplier.setAvatarUrl("https://res.cloudinary.com/dk7coitah/image/upload/v1760668372/avatar_cflwdp.jpg");

            supplier = supplierRepository.save(supplier);

            // Step 3: Send OTP
            otpService.sendOtpToEmail(request.getEmail());

            log.info("Supplier Step 1 completed: {} with ID: {}", request.getUsername(), supplier.getUserId());

            return RegisterResponse.builder()
                    .userId(supplier.getUserId())
                    .username(supplier.getUsername())
                    .email(supplier.getEmail())
                    .message("Account created successfully. Please check your email for OTP verification code.")
                    .status(SupplierStatus.PENDING_VERIFICATION.name())
                    .build();

        } catch (DataIntegrityViolationException e) {
            // Rollback Keycloak user if database save fails
            if (keycloakId != null) {
                log.warn("Database save failed for supplier {}. Rolling back Keycloak user with ID: {}", request.getUsername(), keycloakId);
                try {
                    keycloakService.deleteKeycloakUser(keycloakId);
                    log.info("Successfully rolled back Keycloak user: {}", keycloakId);
                } catch (Exception keycloakDeleteException) {
                    log.error("CRITICAL: Failed to rollback Keycloak user {}. Manual cleanup required.", keycloakId, keycloakDeleteException);
                }
            }
            throw handleDataIntegrityViolation(e);
        } catch (Exception e) {
            // Rollback for any other exceptions (e.g., Keycloak user creation itself)
            if (keycloakId != null) {
                log.warn("An unexpected error occurred during registration for supplier {}. Rolling back Keycloak user with ID: {}", request.getUsername(), keycloakId);
                try {
                    keycloakService.deleteKeycloakUser(keycloakId);
                    log.info("Successfully rolled back Keycloak user: {}", keycloakId);
                } catch (Exception keycloakDeleteException) {
                    log.error("CRITICAL: Failed to rollback Keycloak user {}. Manual cleanup required.", keycloakId, keycloakDeleteException);
                }
            }
            // Handle specific Keycloak conflict errors
            String errorMessage = e.getMessage();
            if (errorMessage != null) {
                if (errorMessage.contains("User exists with same email")) {
                    throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
                } else if (errorMessage.contains("User exists with same username")) {
                    throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
                }
            }
            log.error("Failed to register supplier: {}", request.getUsername(), e);
            throw new BadRequestException(ErrorCode.REGISTRATION_FAILED, e.getMessage());
        }
    }

    @Override
    @Transactional
    public String verifyEmailStep2(String supplierId, SupplierRegisterStep2Request request) {
        log.info("Supplier registration Step 2: Verifying OTP for supplier ID: {}", supplierId);

        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check status
        if (supplier.getStatus() != SupplierStatus.PENDING_VERIFICATION) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, 
                    "Supplier is not in PENDING_VERIFICATION status");
        }

        // Verify OTP
        boolean isValid = otpService.verifyOtp(supplier.getEmail(), request.getOtp());
        if (!isValid) {
            throw new BadRequestException(ErrorCode.INVALID_OTP);
        }

        // Update status to PENDING_DOCUMENTS
        supplier.setStatus(SupplierStatus.PENDING_DOCUMENTS);
        supplierRepository.save(supplier);

        log.info("Supplier Step 2 completed: Email verified for {}", supplier.getEmail());

        return "Email verified successfully. Please proceed to upload business documents.";
    }

    @Override
    @Transactional
    public String resendOtp(String supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (supplier.getStatus() != SupplierStatus.PENDING_VERIFICATION) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, 
                    "Can only resend OTP for suppliers in PENDING_VERIFICATION status");
        }

        otpService.sendOtpToEmail(supplier.getEmail());
        
        return "OTP has been resent to your email.";
    }

    @Override
    @Transactional
    public String uploadDocumentsStep3(String supplierId, SupplierRegisterStep3Request request) {
        log.info("Supplier registration Step 3: Uploading documents for supplier ID: {}", supplierId);

        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check status
        if (supplier.getStatus() != SupplierStatus.PENDING_DOCUMENTS) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Supplier is not in PENDING_DOCUMENTS status");
        }

        // Validate business license (required)
        if (request.getBusinessLicenseUrl() == null || request.getBusinessLicenseUrl().isBlank()) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Business license URL is required");
        }
        if (request.getBusinessLicense() == null || request.getBusinessLicense().isBlank()) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Business license number is required");
        }

        // Validate food safety certificate (required)
        if (request.getFoodSafetyCertificateUrl() == null || request.getFoodSafetyCertificateUrl().isBlank()) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Food safety certificate URL is required");
        }
        if (request.getFoodSafetyCertificate() == null || request.getFoodSafetyCertificate().isBlank()) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Food safety certificate number is required");
        }

        // Update supplier with document information
        supplier.setBusinessLicense(request.getBusinessLicense());
        supplier.setBusinessLicenseUrl(request.getBusinessLicenseUrl());
        supplier.setFoodSafetyCertificate(request.getFoodSafetyCertificate());
        supplier.setFoodSafetyCertificateUrl(request.getFoodSafetyCertificateUrl());

        // Avatar is optional
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            supplier.setAvatarUrl(request.getAvatarUrl());
        }

        // Update status to PENDING_STORE_INFO
        supplier.setStatus(SupplierStatus.PENDING_STORE_INFO);
        supplierRepository.save(supplier);

        log.info("Supplier Step 3 completed: Documents uploaded for {}", supplier.getUsername());

        return "Documents uploaded successfully. Please proceed to submit store information.";
    }

    @Override
    @Transactional
    public String submitStoreInfoStep4(String supplierId, SupplierRegisterStep4Request request) {
        log.info("Supplier registration Step 4: Submitting store info for supplier ID: {}", supplierId);

        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check status
        if (supplier.getStatus() != SupplierStatus.PENDING_STORE_INFO) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Supplier is not in PENDING_STORE_INFO status");
        }

        // Validate required business fields
        if (request.getBusinessName() == null || request.getBusinessName().isBlank()) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Business name is required");
        }
        if (request.getBusinessAddress() == null || request.getBusinessAddress().isBlank()) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Business address is required");
        }
        if (request.getTaxCode() == null || request.getTaxCode().isBlank()) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Tax code is required");
        }
        if (request.getBusinessType() == null) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Business type is required");
        }

        // Update supplier business information
        // Note: businessLicense and foodSafetyCertificate were already set in Step 3
        supplier.setBusinessName(request.getBusinessName());
        supplier.setBusinessAddress(request.getBusinessAddress());
        supplier.setTaxCode(request.getTaxCode());
        supplier.setBusinessType(request.getBusinessType());

        // Update status to PENDING_APPROVAL (waiting for admin)
        supplier.setStatus(SupplierStatus.PENDING_APPROVAL);

        // IMPORTANT: Save supplier FIRST before creating store
        supplier = supplierRepository.save(supplier);

        // Send in-app notification to all admins about new supplier registration
        try {
            String notificationContent = String.format(
                    "Nhà cung cấp mới '%s' đã hoàn thành đăng ký và đang chờ phê duyệt.",
                    supplier.getBusinessName()
            );
            String linkUrl = "/partners/pending"; // Link to pending suppliers page
            inAppNotificationService.createNotificationForAllAdmins(
                    NotificationType.NEW_SUPPLIER_REGISTRATION,
                    notificationContent,
                    linkUrl
            );
            log.info("In-app notification sent to admins about new supplier registration: {}", supplier.getUserId());
        } catch (Exception e) {
            log.error("Failed to send in-app notification for new supplier registration: {}", supplier.getUserId(), e);
            // Don't fail the operation if notification fails
        }

        // Now create store with the persisted supplier
        Store store = new Store();
        store.setStoreName(request.getStoreName());
        store.setAddress(request.getStoreAddress());
        store.setPhoneNumber(request.getStorePhoneNumber());
        store.setLatitude(request.getLatitude());
        store.setLongitude(request.getLongitude());
        store.setDescription(request.getStoreDescription());
        store.setSupplier(supplier);
        store.setStatus(StoreStatus.PENDING); // Store pending until supplier approved

        storeRepository.save(store);

        log.info("Supplier Step 4 completed: Registration submitted for admin approval - {}", supplier.getUsername());

        return "Registration completed successfully! Your application is pending admin approval. " +
               "You will be notified via email once your account is approved.";
    }

    // ========== PROFILE MANAGEMENT ==========

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getSupplierInfo(String keycloakId) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Supplier supplier)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "User is not a supplier");
        }

        return supplierMapper.toResponse(supplier);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getPublicSupplierInfo(String supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Only show active suppliers publicly
        if (supplier.getStatus() != SupplierStatus.ACTIVE) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        return supplierMapper.toPublicResponse(supplier);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(String userId) {
        Supplier supplier = supplierRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        return supplierMapper.toResponse(supplier);
    }

    @Override
    @Transactional
    public SupplierResponse updateProfile(String keycloakId, SupplierProfileUpdateRequest request) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Supplier supplier)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "User is not a supplier");
        }

        boolean needsKeycloakUpdate = false;
        String newFirstName = null;
        String newLastName = null;

        // Update fields
        if (request.getFullName() != null) {
            supplier.setFullName(request.getFullName());
            // Split name for Keycloak
            String[] nameParts = request.getFullName().trim().split("\\s+", 2);
            newFirstName = nameParts[0];
            newLastName = nameParts.length > 1 ? nameParts[1] : "";
            needsKeycloakUpdate = true;
        }
        if (request.getPhoneNumber() != null) {
            ValidationUtils.validatePhoneNumber(request.getPhoneNumber());
            supplier.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAvatarUrl() != null) {
            supplier.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBusinessAddress() != null) {
            supplier.setBusinessAddress(request.getBusinessAddress());
        }

        supplier = supplierRepository.save(supplier);

        // Send in-app notification to all admins about supplier profile update
        try {
            String notificationContent = String.format(
                    "Nhà cung cấp '%s' đã cập nhật thông tin hồ sơ.",
                    supplier.getBusinessName() != null ? supplier.getBusinessName() : supplier.getFullName()
            );
            String linkUrl = "/partners/list"; // Link to suppliers list
            inAppNotificationService.createNotificationForAllAdmins(
                    NotificationType.SUPPLIER_UPDATE,
                    notificationContent,
                    linkUrl
            );
            log.info("In-app notification sent to admins about supplier profile update: {}", supplier.getUserId());
        } catch (Exception e) {
            log.error("Failed to send in-app notification for supplier profile update: {}", supplier.getUserId(), e);
            // Don't fail the operation if notification fails
        }

        // Update Keycloak if name changed (email doesn't change for suppliers)
        if (needsKeycloakUpdate) {
            try {
                keycloakService.updateKeycloakUser(
                        keycloakId,
                        supplier.getEmail(),
                        newFirstName,
                        newLastName
                );
                log.info("Keycloak user updated successfully for keycloakId: {}", keycloakId);
            } catch (Exception e) {
                log.error("Failed to update Keycloak user: {}", keycloakId, e);
                // Don't fail the operation, log the error
            }
        }

        return supplierMapper.toResponse(supplier);
    }

    // ========== ADMIN OPERATIONS ==========

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<SupplierResponse> getAllSuppliers(
            int page,
            int size,
            SupplierStatus status,
            String search,
            String sortBy,
            String sortDirection
    ) {
        log.info("Getting suppliers: page={}, size={}, status={}, search={}", page, size, status, search);

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
        org.springframework.data.domain.Page<Supplier> suppliersPage =
                supplierRepository.findByStatusAndSearch(status, search, pageable);

        // Map to response
        return suppliersPage.map(supplierMapper::toResponse);
    }

    @Override
    @Transactional
    public SupplierResponse approveSupplier(String userId, String approvalNote) {
        log.info("Approving supplier: userId={}", userId);

        Supplier supplier = supplierRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check if supplier is in PENDING_APPROVAL status
        if (supplier.getStatus() != SupplierStatus.PENDING_APPROVAL) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Supplier is not in PENDING_APPROVAL status");
        }

        // Update status to ACTIVE
        supplier.setStatus(SupplierStatus.ACTIVE);
        supplier.setActive(true);

        // Activate all pending stores
        supplier.getStores().forEach(store -> {
            if (store.getStatus() == StoreStatus.PENDING) {
                store.setStatus(StoreStatus.ACTIVE);
            }
        });

        supplier = supplierRepository.save(supplier);

        // Send in-app notification to supplier about approval
        try {
            String notificationContent = String.format(
                    "Chúc mừng! Tài khoản nhà cung cấp của bạn đã được phê duyệt. %s",
                    approvalNote != null && !approvalNote.isBlank() ? "Ghi chú: " + approvalNote : ""
            );
            String linkUrl = "/dashboard/overview"; // Link to supplier dashboard
            inAppNotificationService.createNotificationForUser(
                    supplier.getUserId(),
                    NotificationType.SUPPLIER_APPROVED,
                    notificationContent,
                    linkUrl
            );
            log.info("In-app notification sent to supplier about approval: {}", supplier.getUserId());
        } catch (Exception e) {
            log.error("Failed to send in-app notification for supplier approval: {}", supplier.getUserId(), e);
            // Don't fail the operation if notification fails
        }

        // Create wallet for supplier
        try {
            walletService.createWallet(supplier);
            log.info("Wallet created for supplier ID: {}", supplier.getUserId());
        } catch (Exception e) {
            log.error("Failed to create wallet for supplier ID: {}", supplier.getUserId(), e);
            // Don't fail the approval if wallet creation fails
        }

        // Queue approval email notification (will auto-retry on failure)
        try {
            String subject = "SaveFood - Your Supplier Account Has Been Approved!";
            String message = buildApprovalEmailMessage(supplier, approvalNote);
            notificationService.queueNotification(
                    EmailNotificationType.SUPPLIER_APPROVAL,
                    supplier.getEmail(),
                    subject,
                    message,
                    supplier.getUserId()
            );
            log.info("Approval email queued for: {}", supplier.getEmail());
        } catch (Exception e) {
            log.error("Failed to queue approval email for: {}", supplier.getEmail(), e);
            // Don't fail the operation if queueing fails
        }

        return supplierMapper.toResponse(supplier);
    }

    @Override
    @Transactional
    public SupplierResponse rejectSupplier(String userId, String rejectionReason) {
        log.info("Rejecting supplier: userId={}", userId);

        Supplier supplier = supplierRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check if supplier is in PENDING_APPROVAL status
        if (supplier.getStatus() != SupplierStatus.PENDING_APPROVAL) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Supplier is not in PENDING_APPROVAL status");
        }

        // Update status to REJECTED
        supplier.setStatus(SupplierStatus.REJECTED);
        supplier.setActive(false);

        supplier = supplierRepository.save(supplier);

        // Send in-app notification to supplier about rejection
        try {
            String notificationContent = String.format(
                    "Rất tiếc, đơn đăng ký nhà cung cấp của bạn đã bị từ chối. %s",
                    rejectionReason != null && !rejectionReason.isBlank() ? "Lý do: " + rejectionReason : ""
            );
            String linkUrl = "/profile/my-profile"; // Link to profile page
            inAppNotificationService.createNotificationForUser(
                    supplier.getUserId(),
                    NotificationType.SUPPLIER_REJECTED,
                    notificationContent,
                    linkUrl
            );
            log.info("In-app notification sent to supplier about rejection: {}", supplier.getUserId());
        } catch (Exception e) {
            log.error("Failed to send in-app notification for supplier rejection: {}", supplier.getUserId(), e);
            // Don't fail the operation if notification fails
        }

        // Queue rejection email notification (will auto-retry on failure)
        try {
            String subject = "SaveFood - Supplier Application Status Update";
            String message = buildRejectionEmailMessage(supplier, rejectionReason);
            notificationService.queueNotification(
                    EmailNotificationType.SUPPLIER_REJECTION,
                    supplier.getEmail(),
                    subject,
                    message,
                    supplier.getUserId()
            );
            log.info("Rejection email queued for: {}", supplier.getEmail());
        } catch (Exception e) {
            log.error("Failed to queue rejection email for: {}", supplier.getEmail(), e);
            // Don't fail the operation if queueing fails
        }

        return supplierMapper.toResponse(supplier);
    }

    @Override
    @Transactional
    public SupplierResponse updateStatus(String userId, SupplierStatus status) {
        Supplier supplier = supplierRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        supplier.setStatus(status);

        // If approved, activate account and update stores
        if (status == SupplierStatus.ACTIVE) {
            supplier.setActive(true);
            // Activate all pending stores
            supplier.getStores().forEach(store -> {
                if (store.getStatus() == StoreStatus.PENDING) {
                    store.setStatus(StoreStatus.ACTIVE);
                }
            });
        }

        supplier = supplierRepository.save(supplier);
        return supplierMapper.toResponse(supplier);
    }

    @Override
    @Transactional
    public SupplierResponse updateCommissionRate(String userId, SupplierCommissionUpdateRequest request) {
        Supplier supplier = supplierRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Use mapper to update commission rate
        supplierMapper.updateCommissionRate(supplier, request);
        
        supplier = supplierRepository.save(supplier);
        return supplierMapper.toResponse(supplier);
    }

    @Override
    @Transactional
    public SupplierResponse setActive(String userId, boolean active) {
        Supplier supplier = supplierRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        supplier.setActive(active);
        supplier = supplierRepository.save(supplier);
        
        return supplierMapper.toResponse(supplier);
    }

    // ========== HELPER METHODS ==========

    private String[] splitFullName(String fullName) {
        String[] parts = fullName.trim().split("\\s+", 2);
        return new String[]{parts[0], parts.length > 1 ? parts[1] : ""};
    }

    private ConflictException handleDataIntegrityViolation(DataIntegrityViolationException e) {
        String errorMessage = e.getMessage().toLowerCase();
        if (errorMessage.contains("username")) {
            return new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
        } else if (errorMessage.contains("email")) {
            return new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
        } else if (errorMessage.contains("phone")) {
            return new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
        } else if (errorMessage.contains("business_license")) {
            return new ConflictException(ErrorCode.BUSINESS_LICENSE_ALREADY_EXISTS);
        } else if (errorMessage.contains("tax_code")) {
            return new ConflictException(ErrorCode.TAX_CODE_ALREADY_EXISTS);
        } else {
            return new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }
    }

    private String buildApprovalEmailMessage(Supplier supplier, String approvalNote) {
        StringBuilder message = new StringBuilder();
        message.append("Dear ").append(supplier.getFullName()).append(",\n\n");
        message.append("Congratulations! Your supplier application has been approved.\n\n");
        message.append("Business Details:\n");
        message.append("- Business Name: ").append(supplier.getBusinessName()).append("\n");
        message.append("- Tax Code: ").append(supplier.getTaxCode()).append("\n");
        message.append("- Status: ACTIVE\n\n");

        if (approvalNote != null && !approvalNote.isBlank()) {
            message.append("Note from Admin:\n");
            message.append(approvalNote).append("\n\n");
        }

        message.append("You can now log in to your account and start managing your products and stores.\n\n");
        message.append("Login URL: https://supplier.SaveFood.com/login\n\n");
        message.append("Thank you for joining SaveFood!\n\n");
        message.append("Best regards,\n");
        message.append("SaveFood Team");

        return message.toString();
    }

    private String buildRejectionEmailMessage(Supplier supplier, String rejectionReason) {
        StringBuilder message = new StringBuilder();
        message.append("Dear ").append(supplier.getFullName()).append(",\n\n");
        message.append("Thank you for your interest in becoming a SaveFood supplier.\n\n");
        message.append("After careful review, we regret to inform you that your application has not been approved at this time.\n\n");

        if (rejectionReason != null && !rejectionReason.isBlank()) {
            message.append("Reason:\n");
            message.append(rejectionReason).append("\n\n");
        }

        message.append("If you believe this decision was made in error or if you would like to address the concerns raised, ");
        message.append("please feel free to contact our support team at support@SaveFood.com.\n\n");
        message.append("We appreciate your understanding and wish you the best in your business endeavors.\n\n");
        message.append("Best regards,\n");
        message.append("SaveFood Team");

        return message.toString();
    }
}
