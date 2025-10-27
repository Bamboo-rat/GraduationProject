package com.example.backend.service.impl;

import com.example.backend.dto.request.CategorySuggestionRequest;
import com.example.backend.dto.response.CategorySuggestionResponse;
import com.example.backend.entity.Admin;
import com.example.backend.entity.Category;
import com.example.backend.entity.CategorySuggestion;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.SuggestionStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.CategorySuggestionMapper;
import com.example.backend.repository.AdminRepository;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.repository.CategorySuggestionRepository;
import com.example.backend.repository.SupplierRepository;
import com.example.backend.service.CategorySuggestionService;
import com.example.backend.service.InAppNotificationService;
import com.example.backend.entity.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategorySuggestionServiceImpl implements CategorySuggestionService {

    private final CategorySuggestionRepository suggestionRepository;
    private final SupplierRepository supplierRepository;
    private final AdminRepository adminRepository;
    private final CategoryRepository categoryRepository;
    private final CategorySuggestionMapper suggestionMapper;
    private final InAppNotificationService inAppNotificationService;

    @Override
    @Transactional
    public CategorySuggestionResponse createSuggestion(CategorySuggestionRequest request, String keycloakId) {
        log.info("Creating category suggestion: {} by supplier: {}", request.getName(), keycloakId);

        // Find supplier
        Supplier supplier = supplierRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check if category name already exists (in categories or pending suggestions)
        if (categoryRepository.existsByNameIgnoreCase(request.getName())) {
            throw new ConflictException(ErrorCode.CATEGORY_ALREADY_EXISTS, 
                    "Category with name '" + request.getName() + "' already exists");
        }

        if (suggestionRepository.existsByNameIgnoreCaseAndStatusPending(request.getName())) {
            throw new ConflictException(ErrorCode.CATEGORY_ALREADY_EXISTS, 
                    "A pending suggestion for category '" + request.getName() + "' already exists");
        }

        // Create suggestion
        CategorySuggestion suggestion = new CategorySuggestion();
        suggestion.setName(request.getName());
        suggestion.setReason(request.getReason());
        suggestion.setSupplier(supplier);
        suggestion.setStatus(SuggestionStatus.PENDING);

        suggestion = suggestionRepository.save(suggestion);
        log.info("Category suggestion created successfully: {}", suggestion.getSuggestionId());

        // Send in-app notification to all admins about new category suggestion
        try {
            String notificationContent = String.format(
                    "Nhà cung cấp '%s' đã đề xuất danh mục mới: '%s'",
                    supplier.getBusinessName() != null ? supplier.getBusinessName() : supplier.getFullName(),
                    request.getName()
            );
            String linkUrl = "/products/category-suggestions"; // Link to category suggestions page
            inAppNotificationService.createNotificationForAllAdmins(
                    NotificationType.NEW_CATEGORY_SUGGESTION,
                    notificationContent,
                    linkUrl
            );
            log.info("In-app notification sent to admins about new category suggestion: {}", suggestion.getSuggestionId());
        } catch (Exception e) {
            log.error("Failed to send in-app notification for new category suggestion: {}", suggestion.getSuggestionId(), e);
            // Don't fail the operation if notification fails
        }

        return suggestionMapper.toResponse(suggestion);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CategorySuggestionResponse> getAllSuggestions(SuggestionStatus status, Pageable pageable) {
        Page<CategorySuggestion> suggestions;
        
        if (status != null) {
            suggestions = suggestionRepository.findByStatus(status, pageable);
        } else {
            suggestions = suggestionRepository.findAll(pageable);
        }

        return suggestions.map(suggestionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CategorySuggestionResponse> getMySuggestions(String keycloakId, SuggestionStatus status, Pageable pageable) {
        Supplier supplier = supplierRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Page<CategorySuggestion> suggestions;
        
        if (status != null) {
            suggestions = suggestionRepository.findBySupplierUserIdAndStatus(supplier.getUserId(), status, pageable);
        } else {
            suggestions = suggestionRepository.findBySupplierUserId(supplier.getUserId(), pageable);
        }

        return suggestions.map(suggestionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CategorySuggestionResponse getSuggestionById(String suggestionId) {
        CategorySuggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        return suggestionMapper.toResponse(suggestion);
    }

    @Override
    @Transactional
    public CategorySuggestionResponse approveSuggestion(String suggestionId, String keycloakId, String adminNotes) {
        log.info("Approving category suggestion: {} by admin: {}", suggestionId, keycloakId);

        // Find admin
        Admin admin = adminRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Find suggestion
        CategorySuggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // Validate status
        if (suggestion.getStatus() != SuggestionStatus.PENDING) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, 
                    "Only PENDING suggestions can be approved");
        }

        // Check if category name already exists (double-check)
        if (categoryRepository.existsByNameIgnoreCase(suggestion.getName())) {
            throw new ConflictException(ErrorCode.CATEGORY_ALREADY_EXISTS, 
                    "Category with this name already exists");
        }

        // Create the actual category
        Category category = new Category();
        category.setName(suggestion.getName());
        category.setDescription("Category created from suggestion: " + suggestion.getReason());
        category.setActive(true);
        categoryRepository.save(category);

        // Update suggestion status
        suggestion.setStatus(SuggestionStatus.APPROVED);
        suggestion.setAdminNotes(adminNotes);
        suggestion.setAdmin(admin);
        suggestion.setProcessedAt(LocalDateTime.now());

        suggestion = suggestionRepository.save(suggestion);
        log.info("Category suggestion approved and category created: {}", category.getCategoryId());

        return suggestionMapper.toResponse(suggestion);
    }

    @Override
    @Transactional
    public CategorySuggestionResponse rejectSuggestion(String suggestionId, String keycloakId, String adminNotes) {
        log.info("Rejecting category suggestion: {} by admin: {}", suggestionId, keycloakId);

        // Find admin
        Admin admin = adminRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Find suggestion
        CategorySuggestion suggestion = suggestionRepository.findById(suggestionId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // Validate status
        if (suggestion.getStatus() != SuggestionStatus.PENDING) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, 
                    "Only PENDING suggestions can be rejected");
        }

        // Update suggestion status
        suggestion.setStatus(SuggestionStatus.REJECTED);
        suggestion.setAdminNotes(adminNotes);
        suggestion.setAdmin(admin);
        suggestion.setProcessedAt(LocalDateTime.now());

        suggestion = suggestionRepository.save(suggestion);
        log.info("Category suggestion rejected: {}", suggestionId);

        return suggestionMapper.toResponse(suggestion);
    }
}
