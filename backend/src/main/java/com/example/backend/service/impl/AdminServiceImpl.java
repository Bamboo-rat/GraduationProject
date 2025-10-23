package com.example.backend.service.impl;

import com.example.backend.dto.request.AdminRegisterRequest;
import com.example.backend.dto.request.AdminUpdateRequest;
import com.example.backend.dto.response.AdminResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.entity.Admin;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.AdminStatus;
import com.example.backend.entity.enums.Role;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.AdminMapper;
import com.example.backend.repository.AdminRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.AdminService;
import com.example.backend.service.KeycloakService;
import com.example.backend.utils.ValidationUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service implementation for Admin management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final KeycloakService keycloakService;
    private final AdminMapper adminMapper;

    @Override
    @Transactional
    public RegisterResponse registerAdmin(AdminRegisterRequest request) {
        log.info("Registering new admin/staff: {}", request.getUsername());

        // Validate
        ValidationUtils.validateUsername(request.getUsername());
        ValidationUtils.validateEmail(request.getEmail());
        ValidationUtils.validatePassword(request.getPassword());
        ValidationUtils.validatePhoneNumber(request.getPhoneNumber());

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

            // Assign role in Keycloak
            String keycloakRoleName = toKeycloakRoleName(request.getRole().name());
            keycloakService.assignRoleToUser(keycloakId, keycloakRoleName);

            // Create admin in database
            Admin admin = new Admin();
            admin.setKeycloakId(keycloakId);
            admin.setUsername(request.getUsername());
            admin.setEmail(request.getEmail());
            admin.setPhoneNumber(request.getPhoneNumber());
            admin.setFullName(request.getFullName());
            admin.setRole(request.getRole());

            // Set default avatar if not provided
            if (request.getAvatarUrl() == null || request.getAvatarUrl().isBlank()) {
                admin.setAvatarUrl("https://res.cloudinary.com/dk7coitah/image/upload/v1760668372/avatar_cflwdp.jpg");
            } else {
                admin.setAvatarUrl(request.getAvatarUrl());
            }

            // Admins/staff created by Super Admin are immediately active
            admin.setStatus(AdminStatus.ACTIVE);
            admin.setActive(true);

            admin = adminRepository.save(admin);

            return RegisterResponse.builder()
                    .userId(admin.getUserId())
                    .keycloakId(keycloakId)
                    .username(admin.getUsername())
                    .email(admin.getEmail())
                    .message("Admin/staff registered successfully and activated.")
                    .status(AdminStatus.ACTIVE.name())
                    .build();

        } catch (DataIntegrityViolationException e) {
            cleanupKeycloakUser(keycloakId, request.getUsername());
            
            String errorMessage = e.getMessage().toLowerCase();
            if (errorMessage.contains("username")) {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
            } else if (errorMessage.contains("email")) {
                throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
            } else if (errorMessage.contains("phone")) {
                throw new ConflictException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
            } else {
                throw new ConflictException(ErrorCode.USERNAME_ALREADY_EXISTS);
            }
        } catch (Exception e) {
            cleanupKeycloakUser(keycloakId, request.getUsername());
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AdminResponse getAdminInfo(String keycloakId) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Admin admin)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "User is not an admin");
        }

        return adminMapper.toResponse(admin);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminResponse getAdminById(String userId) {
        Admin admin = adminRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));
        
        return adminMapper.toResponse(admin);
    }

    @Override
    @Transactional
    public AdminResponse updateProfile(String keycloakId, AdminUpdateRequest request) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!(user instanceof Admin admin)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "User is not an admin");
        }

        boolean needsKeycloakUpdate = false;
        String newEmail = null;
        String newFirstName = null;
        String newLastName = null;

        // Update fields
        if (request.getFullName() != null) {
            admin.setFullName(request.getFullName());
            // Split name for Keycloak
            String[] nameParts = request.getFullName().trim().split("\\s+", 2);
            newFirstName = nameParts[0];
            newLastName = nameParts.length > 1 ? nameParts[1] : "";
            needsKeycloakUpdate = true;
        }
        if (request.getEmail() != null) {
            ValidationUtils.validateEmail(request.getEmail());
            admin.setEmail(request.getEmail());
            newEmail = request.getEmail();
            needsKeycloakUpdate = true;
        }
        if (request.getPhoneNumber() != null) {
            ValidationUtils.validatePhoneNumber(request.getPhoneNumber());
            admin.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAvatarUrl() != null) {
            admin.setAvatarUrl(request.getAvatarUrl());
        }

        admin = adminRepository.save(admin);

        // Update Keycloak if email or name changed
        if (needsKeycloakUpdate) {
            try {
                keycloakService.updateKeycloakUser(
                        keycloakId,
                        newEmail != null ? newEmail : admin.getEmail(),
                        newFirstName != null ? newFirstName : splitFullName(admin.getFullName())[0],
                        newLastName != null ? newLastName : splitFullName(admin.getFullName())[1]
                );
                log.info("Keycloak user updated successfully for keycloakId: {}", keycloakId);
            } catch (Exception e) {
                log.error("Failed to update Keycloak user: {}", keycloakId, e);
                // Don't fail the operation, log the error
            }
        }

        return adminMapper.toResponse(admin);
    }

    @Override
    @Transactional
    public AdminResponse updateStatus(String userId, AdminStatus status) {
        Admin admin = adminRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        admin.setStatus(status);

        // Sync active flag with status
        // Only ACTIVE status should have active=true
        admin.setActive(status == AdminStatus.ACTIVE);

        admin = adminRepository.save(admin);

        return adminMapper.toResponse(admin);
    }

    @Override
    @Transactional
    public AdminResponse setActive(String userId, boolean active) {
        Admin admin = adminRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        admin.setActive(active);

        // Sync status with active flag
        // If activating and not pending, set to ACTIVE
        // If deactivating, set to INACTIVE
        if (active) {
            if (admin.getStatus() != AdminStatus.PENDING_APPROVAL) {
                admin.setStatus(AdminStatus.ACTIVE);
            }
        } else {
            admin.setStatus(AdminStatus.INACTIVE);
        }

        admin = adminRepository.save(admin);

        return adminMapper.toResponse(admin);
    }

    @Override
    @Transactional
    public AdminResponse updateRole(String userId, Role role) {
        Admin admin = adminRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        log.info("Updating admin role from {} to {}", admin.getRole(), role);

        // Update role in database
        admin.setRole(role);
        admin = adminRepository.save(admin);

        // Update role in Keycloak
        try {
            String keycloakRoleName = toKeycloakRoleName(role.name());
            keycloakService.assignRoleToUser(admin.getKeycloakId(), keycloakRoleName);
            log.info("Keycloak role updated successfully for keycloakId: {}", admin.getKeycloakId());
        } catch (Exception e) {
            log.error("Failed to update Keycloak role: {}", admin.getKeycloakId(), e);
            // Don't fail the operation, log the error
        }

        return adminMapper.toResponse(admin);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminResponse> getAllAdmins(int page, int size, Role role, AdminStatus status) {
        log.info("Getting all admins - page: {}, size: {}, role: {}, status: {}", page, size, role, status);

        // Create pageable with sorting by createdAt descending
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Admin> adminPage;

        // Apply filters
        if (role != null && status != null) {
            adminPage = adminRepository.findByRoleAndStatus(role, status, pageable);
        } else if (role != null) {
            adminPage = adminRepository.findByRole(role, pageable);
        } else if (status != null) {
            adminPage = adminRepository.findByStatus(status, pageable);
        } else {
            adminPage = adminRepository.findAll(pageable);
        }

        // Map to AdminResponse
        return adminPage.map(adminMapper::toResponse);
    }

    // Helper methods
    private void cleanupKeycloakUser(String keycloakId, String username) {
        if (keycloakId != null) {
            try {
                keycloakService.deleteUser(keycloakId);
            } catch (Exception e) {
                log.error("Failed to cleanup Keycloak user: {}", keycloakId, e);
            }
        }
    }

    private String[] splitFullName(String fullName) {
        String[] parts = fullName.trim().split("\\s+", 2);
        return new String[]{parts[0], parts.length > 1 ? parts[1] : ""};
    }

    private String toKeycloakRoleName(String roleName) {
        return roleName.replace("ROLE_", "").toLowerCase().replace("_", "-");
    }
}
