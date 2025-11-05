package com.example.backend.service.impl;

import com.example.backend.dto.request.PromotionRequest;
import com.example.backend.dto.response.PromotionResponse;
import com.example.backend.entity.Customer;
import com.example.backend.entity.Promotion;
import com.example.backend.entity.PromotionUsage;
import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.entity.enums.PromotionTier;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.PromotionMapper;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.PromotionRepository;
import com.example.backend.repository.PromotionUsageRepository;
import com.example.backend.service.PromotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionMapper promotionMapper;
    private final PromotionUsageRepository promotionUsageRepository;
    private final CustomerRepository customerRepository;

    @Override
    @Transactional
    public PromotionResponse createPromotion(PromotionRequest request) {
        log.info("Creating new promotion: {}", request.getCode());

        // Check if promotion code already exists
        if (promotionRepository.existsByCode(request.getCode())) {
            throw new ConflictException(ErrorCode.PROMOTION_CODE_ALREADY_EXISTS);
        }

        // Validate dates
        validatePromotionDates(request.getStartDate(), request.getEndDate());

        Promotion promotion = new Promotion();
        mapRequestToEntity(request, promotion);

        promotion = promotionRepository.save(promotion);
        log.info("Promotion created successfully: {}", promotion.getPromotionId());

        return promotionMapper.toResponse(promotion);
    }

    @Override
    @Transactional
    public PromotionResponse updatePromotion(String promotionId, PromotionRequest request) {
        log.info("Updating promotion: {}", promotionId);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        // Check if promotion has already started
        if (promotion.getStartDate() != null &&
            promotion.getStartDate().isBefore(LocalDate.now())) {
            // If promotion already started, disallow changing its code or setting a startDate in the past.
            // Other fields may be updated.
            // - If request changes the code -> reject
            if (!promotion.getCode().equals(request.getCode())) {
                throw new BadRequestException(ErrorCode.PROMOTION_ALREADY_STARTED);
            }

            // - If request tries to change startDate to a different value that is before today -> reject
            if (request.getStartDate() != null
                    && !request.getStartDate().isEqual(promotion.getStartDate())
                    && request.getStartDate().isBefore(LocalDate.now())) {
                throw new BadRequestException(ErrorCode.PROMOTION_ALREADY_STARTED);
            }
            // otherwise allow updates to other fields
        }

        // Check if code is being changed and if new code already exists
        if (!promotion.getCode().equals(request.getCode()) &&
            promotionRepository.existsByCodeAndPromotionIdNot(request.getCode(), promotionId)) {
            throw new ConflictException(ErrorCode.PROMOTION_CODE_ALREADY_EXISTS);
        }

        // Validate dates
        validatePromotionDates(request.getStartDate(), request.getEndDate());

        mapRequestToEntity(request, promotion);

        promotion = promotionRepository.save(promotion);
        log.info("Promotion updated successfully: {}", promotionId);

        return promotionMapper.toResponse(promotion);
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse getPromotionById(String promotionId) {
        log.info("Getting promotion by ID: {}", promotionId);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        return promotionMapper.toResponse(promotion);
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse getPromotionByCode(String code) {
        log.info("Getting promotion by code: {}", code);

        Promotion promotion = promotionRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        return promotionMapper.toResponse(promotion);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionResponse> getAllPromotions(
            int page,
            int size,
            PromotionStatus status,
            PromotionTier tier,
            Boolean isHighlighted,
            String search,
            String sortBy,
            String sortDirection
    ) {
        log.info("Getting all promotions: page={}, size={}, status={}, tier={}, isHighlighted={}, search={}",
                page, size, status, tier, isHighlighted, search);

        // Validate and set defaults
        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "createdAt";
        }
        if (sortDirection == null || sortDirection.isBlank()) {
            sortDirection = "DESC";
        }

        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC") ?
                Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<Promotion> promotions = promotionRepository.findByFilters(
                status, tier, isHighlighted, search, pageable);

        return promotions.map(promotionMapper::toResponse);
    }

    @Override
    @Transactional
    public void deletePromotion(String promotionId) {
        log.info("Deleting promotion: {}", promotionId);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        // Check if promotion has been used
        if (promotion.getCurrentUsageCount() != null && promotion.getCurrentUsageCount() > 0) {
            log.warn("Cannot delete promotion {} - it has been used {} times",
                    promotionId, promotion.getCurrentUsageCount());
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Cannot delete promotion that has already been used");
        }

        promotionRepository.delete(promotion);
        log.info("Promotion deleted successfully: {}", promotionId);
    }

    @Override
    @Transactional
    public PromotionResponse toggleStatus(String promotionId, PromotionStatus status) {
        log.info("Toggling promotion status: promotionId={}, status={}", promotionId, status);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        promotion.setStatus(status);
        promotion = promotionRepository.save(promotion);

        log.info("Promotion status toggled successfully: {}", promotionId);

        return promotionMapper.toResponse(promotion);
    }

    @Override
    @Transactional
    public PromotionResponse validatePromotionCode(String code, String customerId, BigDecimal orderAmount) {
        log.info("Validating promotion code: {} for customer: {} with order amount: {}",
                code, customerId, orderAmount);

        customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Find promotion by code
        Promotion promotion = promotionRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        // Check if promotion is active
        if (promotion.getStatus() != PromotionStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.PROMOTION_EXPIRED_OR_INACTIVE);
        }

        // Check date validity
        LocalDate today = LocalDate.now();
        if (promotion.getStartDate() != null && promotion.getStartDate().isAfter(today)) {
            throw new BadRequestException(ErrorCode.PROMOTION_EXPIRED_OR_INACTIVE,
                    "Promotion has not started yet");
        }
        if (promotion.getEndDate() != null && promotion.getEndDate().isBefore(today)) {
            throw new BadRequestException(ErrorCode.PROMOTION_EXPIRED_OR_INACTIVE,
                    "Promotion has expired");
        }

        // Check minimum order amount
        if (promotion.getMinimumOrderAmount() != null &&
            orderAmount.compareTo(promotion.getMinimumOrderAmount()) < 0) {
            throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                    String.format("Minimum order amount is %s", promotion.getMinimumOrderAmount()));
        }

        // Check total usage limit
        if (promotion.getTotalUsageLimit() != null &&
            promotion.getCurrentUsageCount() >= promotion.getTotalUsageLimit()) {
            throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                    "Promotion usage limit has been reached");
        }

        // Check per-customer usage limit
        if (promotion.getUsagePerCustomerLimit() != null) {
            long customerUsageCount = promotionUsageRepository.countByPromotionAndCustomer(
                    promotion.getPromotionId(), customerId);

            if (customerUsageCount >= promotion.getUsagePerCustomerLimit()) {
                throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                        String.format("You have already used this promotion %d times (limit: %d)",
                                customerUsageCount, promotion.getUsagePerCustomerLimit()));
            }
        }

        // Validation succeeded
        log.info("Promotion code validated successfully: {}", code);
        return promotionMapper.toResponse(promotion);
    }

    @Override
    @Transactional
    public PromotionResponse applyPromotionToOrder(String code, String customerId, BigDecimal orderAmount) {
        log.info("Applying promotion code: {} for customer: {} with order amount: {}",
                code, customerId, orderAmount);

        // Step 1: Acquire pessimistic write lock on the promotion
        // This prevents other transactions from reading/writing this promotion
        Promotion promotion = promotionRepository.findByCodeWithLock(code)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        // Step 2: Validate promotion (same as validatePromotionCode but with locked entity)
        if (promotion.getStatus() != PromotionStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.PROMOTION_EXPIRED_OR_INACTIVE);
        }

        LocalDate today = LocalDate.now();
        if (promotion.getStartDate() != null && promotion.getStartDate().isAfter(today)) {
            throw new BadRequestException(ErrorCode.PROMOTION_EXPIRED_OR_INACTIVE,
                    "Promotion has not started yet");
        }
        if (promotion.getEndDate() != null && promotion.getEndDate().isBefore(today)) {
            throw new BadRequestException(ErrorCode.PROMOTION_EXPIRED_OR_INACTIVE,
                    "Promotion has expired");
        }

        if (promotion.getMinimumOrderAmount() != null &&
            orderAmount.compareTo(promotion.getMinimumOrderAmount()) < 0) {
            throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                    String.format("Minimum order amount is %s", promotion.getMinimumOrderAmount()));
        }

        // Step 3: Check per-customer usage limit BEFORE incrementing
        if (promotion.getUsagePerCustomerLimit() != null) {
            long customerUsageCount = promotionUsageRepository.countByPromotionAndCustomer(
                    promotion.getPromotionId(), customerId);

            if (customerUsageCount >= promotion.getUsagePerCustomerLimit()) {
                throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                        String.format("You have already used this promotion %d times (limit: %d)",
                                customerUsageCount, promotion.getUsagePerCustomerLimit()));
            }
        }

        // Step 4: Check total usage limit BEFORE incrementing (while holding lock)
        if (promotion.getTotalUsageLimit() != null &&
            promotion.getCurrentUsageCount() >= promotion.getTotalUsageLimit()) {
            throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                    "Promotion usage limit has been reached");
        }

        // Step 5: Atomically increment usage count using database-level operation
        // This is an additional safety layer (database enforces the constraint)
        int updated = promotionRepository.incrementUsageCountIfAvailable(promotion.getPromotionId());

        if (updated == 0) {
            // This means another transaction beat us to the last slot
            throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                    "Promotion usage limit has been reached");
        }

        // Step 6: Refresh the entity to get updated usage count
        promotionRepository.flush();
        promotion = promotionRepository.findById(promotion.getPromotionId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        // Step 7: Calculate discount amount
        BigDecimal discountAmount = calculateDiscountAmount(promotion, orderAmount);

        // Step 8: Create PromotionUsage record for per-customer tracking
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        PromotionUsage usage = new PromotionUsage();
        usage.setPromotion(promotion);
        usage.setCustomer(customer);
        usage.setOrderAmount(orderAmount);
        usage.setDiscountAmount(discountAmount);
        // Note: Order will be set later when the actual order is created
        // usage.setOrder(order);

        usage = promotionUsageRepository.save(usage);

        log.info("Promotion applied successfully: {} (usage: {}/{}), discount: {}",
                code, promotion.getCurrentUsageCount(), promotion.getTotalUsageLimit(), discountAmount);

        return promotionMapper.toResponse(promotion);
    }

    /**
     * Validate promotion dates
     */
    private void validatePromotionDates(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return; // Dates are optional
        }

        if (endDate.isBefore(startDate)) {
            throw new BadRequestException(ErrorCode.INVALID_PROMOTION_DATES);
        }

        // Optionally check if start date is in the past
        // (commented out to allow creating promotions with past dates for testing)
        // if (startDate.isBefore(LocalDate.now())) {
        //     throw new BadRequestException(ErrorCode.INVALID_PROMOTION_DATES,
        //             "Start date cannot be in the past");
        // }
    }

    /**
     * Map PromotionRequest to Promotion entity
     */
    private void mapRequestToEntity(PromotionRequest request, Promotion promotion) {
        promotion.setCode(request.getCode());
        promotion.setTitle(request.getTitle());
        promotion.setDescription(request.getDescription());
        promotion.setType(request.getType());
        promotion.setTier(request.getTier());
        promotion.setDiscountValue(request.getDiscountValue());
        promotion.setMinimumOrderAmount(request.getMinimumOrderAmount());
        promotion.setMaxDiscountAmount(request.getMaxDiscountAmount());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion.setTotalUsageLimit(request.getTotalUsageLimit());
        promotion.setUsagePerCustomerLimit(request.getUsagePerCustomerLimit());

        // Set status - default to ACTIVE if not provided
        if (request.getStatus() != null) {
            promotion.setStatus(request.getStatus());
        } else if (promotion.getStatus() == null) {
            promotion.setStatus(PromotionStatus.ACTIVE);
        }

        // Set isHighlighted - default to false if not provided
        if (request.getIsHighlighted() != null) {
            promotion.setHighlighted(request.getIsHighlighted());
        } else if (promotion.getPromotionId() == null) { // Only set default for new promotions
            promotion.setHighlighted(false);
        }
    }

    /**
     * Calculate discount amount based on promotion type
     */
    private BigDecimal calculateDiscountAmount(Promotion promotion, BigDecimal orderAmount) {
        BigDecimal discount;

        if (promotion.getType() == com.example.backend.entity.enums.PromotionType.PERCENTAGE) {
            // Percentage discount: orderAmount * (discountValue / 100)
            discount = orderAmount.multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);

            // Apply max discount limit if set
            if (promotion.getMaxDiscountAmount() != null &&
                discount.compareTo(promotion.getMaxDiscountAmount()) > 0) {
                discount = promotion.getMaxDiscountAmount();
            }
        } else {
            // Fixed amount discount
            discount = promotion.getDiscountValue();

            // Discount cannot exceed order amount
            if (discount.compareTo(orderAmount) > 0) {
                discount = orderAmount;
            }
        }

        return discount;
    }
}
