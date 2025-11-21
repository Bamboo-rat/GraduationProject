package com.example.backend.service.impl;

import com.example.backend.dto.request.CreateReviewRequest;
import com.example.backend.dto.request.UpdateReviewRequest;
import com.example.backend.dto.response.ProductRatingResponse;
import com.example.backend.dto.response.ReviewResponse;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.PointTransactionType;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.*;
import com.example.backend.service.InAppNotificationService;
import com.example.backend.service.ReviewService;
import com.example.backend.service.SystemConfigService;
import com.example.backend.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final SystemConfigService systemConfigService;
    private final SupplierRepository supplierRepository;
    private final InAppNotificationService inAppNotificationService;

    private static final String CONFIG_KEY_REVIEW_BONUS_POINTS = "points.review.bonus";
    private static final String CONFIG_KEY_REVIEW_IMAGE_BONUS_POINTS = "points.review.image.bonus";
    private static final int DEFAULT_REVIEW_BONUS_POINTS = 10;
    private static final int DEFAULT_REVIEW_IMAGE_BONUS_POINTS = 5;
    private static final int REVIEW_EDIT_WINDOW_DAYS = 7; // Can edit within 7 days

    @Override
    @Transactional
    public ReviewResponse createReview(String customerId, CreateReviewRequest request) {
        log.info("Creating review: customerId={}, orderDetailId={}", customerId, request.getOrderDetailId());

        // Get customer
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Get order detail
        OrderDetail orderDetail = orderDetailRepository.findById(request.getOrderDetailId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND,
                        "Không tìm thấy chi tiết đơn hàng"));

        // Validate: Order must be delivered
        if (orderDetail.getOrder().getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể đánh giá đơn hàng đã giao thành công");
        }

        // Validate: Customer must own this order
        if (!orderDetail.getOrder().getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền đánh giá đơn hàng này");
        }

        // Validate: Can only review once per order detail
        if (reviewRepository.existsByOrderDetail(orderDetail)) {
            throw new BadRequestException(ErrorCode.RESOURCE_ALREADY_EXISTS,
                    "Bạn đã đánh giá sản phẩm này rồi");
        }

        // Validate: Product and variant must be active
        ProductVariant variant = orderDetail.getStoreProduct().getVariant();
        Product product = variant.getProduct();
        
        if (product.getStatus() != com.example.backend.entity.enums.ProductStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Không thể đánh giá sản phẩm không còn hoạt động");
        }

        // Create review (now linked to ProductVariant instead of Product)
        Review review = new Review();
        review.setCustomer(customer);
        review.setProductVariant(orderDetail.getStoreProduct().getVariant());
        review.setStore(orderDetail.getOrder().getStore());
        review.setOrderDetail(orderDetail);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setImageUrl(request.getImageUrl());
        review.setMarkedAsSpam(false);

        review = reviewRepository.saveAndFlush(review);
        orderDetail.setReview(review);
        orderDetailRepository.save(orderDetail);

        log.info("Review created successfully: reviewId={}", review.getReviewId());

        // Award bonus points for reviewing
        int bonusPoints = systemConfigService.getConfigValueAsInteger(
                CONFIG_KEY_REVIEW_BONUS_POINTS,
                DEFAULT_REVIEW_BONUS_POINTS
        );

        // Award additional bonus points if review has image
        boolean hasImage = request.getImageUrl() != null && !request.getImageUrl().trim().isEmpty();
        int imageBonusPoints = 0;
        if (hasImage) {
            imageBonusPoints = systemConfigService.getConfigValueAsInteger(
                    CONFIG_KEY_REVIEW_IMAGE_BONUS_POINTS,
                    DEFAULT_REVIEW_IMAGE_BONUS_POINTS
            );
            bonusPoints += imageBonusPoints;
        }

        customer.setPoints(customer.getPoints() + bonusPoints);
        customer.setLifetimePoints(customer.getLifetimePoints() + bonusPoints);
        customerRepository.save(customer);

        // Create point transaction record
        PointTransaction pointTransaction = new PointTransaction();
        pointTransaction.setCustomer(customer);
        pointTransaction.setTransactionType(PointTransactionType.BONUS);
        pointTransaction.setPointsChange(bonusPoints);
        
        String reason = "Đánh giá sản phẩm " + review.getProductVariant().getProduct().getName() +
                " (" + review.getProductVariant().getName() + ")" +
                " - Đơn hàng #" + orderDetail.getOrder().getOrderCode();
        if (hasImage) {
            reason += " (có ảnh minh họa)";
        }
        pointTransaction.setReason(reason);
        pointTransactionRepository.save(pointTransaction);

        log.info("Awarded {} bonus points for review (base: {}, image: {}): customerId={}, reviewId={}",
                bonusPoints, bonusPoints - imageBonusPoints, imageBonusPoints, customerId, review.getReviewId());

        return mapToResponse(review, customerId);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(String customerId, String reviewId, UpdateReviewRequest request) {
        log.info("Updating review: customerId={}, reviewId={}", customerId, reviewId);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy đánh giá"));

        // Verify ownership
        if (!review.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền sửa đánh giá này");
        }

        // Check edit window (e.g., can only edit within 7 days)
        LocalDateTime editDeadline = review.getCreatedAt().plusDays(REVIEW_EDIT_WINDOW_DAYS);
        if (LocalDateTime.now().isAfter(editDeadline)) {
            throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Đã quá thời hạn chỉnh sửa đánh giá (7 ngày)");
        }

        if (review.isMarkedAsSpam()) {
            throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Không thể chỉnh sửa đánh giá đã bị đánh dấu spam");
        }

        // Update review
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setImageUrl(request.getImageUrl());
        review = reviewRepository.save(review);

        log.info("Review updated successfully: reviewId={}", reviewId);
        return mapToResponse(review, customerId);
    }

    @Override
    @Transactional
    public void deleteReview(String customerId, String reviewId) {
        log.info("Deleting review: customerId={}, reviewId={}", customerId, reviewId);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy đánh giá"));

        // Verify ownership
        if (!review.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền xóa đánh giá này");
        }

        LocalDateTime deleteDeadline = review.getCreatedAt().plusDays(REVIEW_EDIT_WINDOW_DAYS);
        if (LocalDateTime.now().isAfter(deleteDeadline)) {
            throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Đã quá thời hạn xóa đánh giá (7 ngày)");
        }

        // Remove reference from order detail
        OrderDetail orderDetail = review.getOrderDetail();
        if (orderDetail != null) {
            orderDetail.setReview(null);
            orderDetailRepository.save(orderDetail);
        }

        reviewRepository.delete(review);
        log.info("Review deleted successfully: reviewId={}", reviewId);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy đánh giá"));
        return mapToResponse(review, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getCustomerReviews(String customerId, int page, int size) {
        log.info("Getting reviews by customer: customerId={}", customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviews = reviewRepository.findByCustomerOrderByCreatedAtDesc(customer, pageable);

        return reviews.map(review -> mapToResponse(review, customerId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(String productVariantId, Integer rating, int page, int size) {
        log.info("Getting reviews by product variant: variantId={}, rating={}", productVariantId, rating);

        ProductVariant variant = productVariantRepository.findById(productVariantId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PRODUCT_NOT_FOUND,
                        "Không tìm thấy biến thể sản phẩm"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Review> reviews;
        if (rating != null) {
            reviews = reviewRepository.findByProductVariantAndRatingRange(variant, rating, rating, pageable);
        } else {
            reviews = reviewRepository.findByProductVariantAndMarkedAsSpamFalseOrderByCreatedAtDesc(variant, pageable);
        }

        return reviews.map(review -> mapToResponse(review, null));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getAllProductReviews(String productId, Integer rating, int page, int size) {
        log.info("Getting all reviews by product: productId={}, rating={}", productId, rating);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PRODUCT_NOT_FOUND,
                        "Không tìm thấy sản phẩm"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Review> reviews;
        if (rating != null) {
            reviews = reviewRepository.findByProductAndRatingRange(product, rating, rating, pageable);
        } else {
            reviews = reviewRepository.findByProductAndMarkedAsSpamFalseOrderByCreatedAtDesc(product, pageable);
        }

        return reviews.map(review -> mapToResponse(review, null));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getStoreReviews(String storeId, int page, int size) {
        log.info("Getting reviews by store: storeId={}", storeId);

        Store store = new Store();
        store.setStoreId(storeId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviews = reviewRepository.findByStoreAndMarkedAsSpamFalseOrderByCreatedAtDesc(store, pageable);

        return reviews.map(review -> mapToResponse(review, null));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getSupplierReviews(String supplierId, int page, int size) {
        log.info("Getting all reviews for supplier: supplierId={}", supplierId);

        // Verify supplier exists
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                        "Không tìm thấy nhà cung cấp"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviews = reviewRepository.findBySupplierIdAndMarkedAsSpamFalseOrderByCreatedAtDesc(supplierId, pageable);

        return reviews.map(review -> mapToResponse(review, supplierId));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductRatingResponse getProductRating(String productVariantId) {
        log.info("Getting product variant rating: variantId={}", productVariantId);

        ProductVariant variant = productVariantRepository.findById(productVariantId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PRODUCT_NOT_FOUND,
                        "Không tìm thấy biến thể sản phẩm"));

        Double averageRating = reviewRepository.calculateAverageRating(variant);
        long totalReviews = reviewRepository.countReviewsByProductVariant(variant);
        List<Object[]> ratingDist = reviewRepository.getRatingDistribution(variant);

        // Build rating distribution map
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }
        for (Object[] row : ratingDist) {
            int rating = (int) row[0];
            long count = (long) row[1];
            ratingDistribution.put(rating, count);
        }

        // Calculate percentage
        Map<Integer, Double> ratingPercentage = new HashMap<>();
        for (Map.Entry<Integer, Long> entry : ratingDistribution.entrySet()) {
            double percentage = totalReviews > 0
                    ? (entry.getValue() * 100.0) / totalReviews
                    : 0.0;
            ratingPercentage.put(entry.getKey(), percentage);
        }

        return ProductRatingResponse.builder()
                .productId(variant.getProduct().getProductId())
                .productName(variant.getProduct().getName() + " - " + variant.getName())
                .averageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0)
                .totalReviews(totalReviews)
                .ratingDistribution(ratingDistribution)
                .ratingPercentage(ratingPercentage)
                .build();
    }

    @Override
    @Transactional
    public ReviewResponse markAsSpam(String reviewId, boolean isSpam) {
        log.info("Marking review as spam: reviewId={}, isSpam={}", reviewId, isSpam);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy đánh giá"));

        review.setMarkedAsSpam(isSpam);
        review = reviewRepository.save(review);

        log.info("Review spam status updated: reviewId={}, isSpam={}", reviewId, isSpam);
        return mapToResponse(review, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getSpamReviews(int page, int size) {
        log.info("Getting spam reviews for moderation");

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviews = reviewRepository.findByMarkedAsSpamTrueOrderByCreatedAtDesc(pageable);

        return reviews.map(review -> mapToResponse(review, null));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> searchReviews(String productVariantId, String keyword, int page, int size) {
        log.info("Searching reviews: variantId={}, keyword={}", productVariantId, keyword);

        ProductVariant variant = productVariantRepository.findById(productVariantId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PRODUCT_NOT_FOUND,
                        "Không tìm thấy biến thể sản phẩm"));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviews = reviewRepository.searchByKeyword(variant, keyword, pageable);

        return reviews.map(review -> mapToResponse(review, null));
    }

    // Helper methods

    private ReviewResponse mapToResponse(Review review, String currentCustomerId) {
        ProductVariant variant = review.getProductVariant();
        Product product = variant.getProduct();
        
        // Try to get variant image first, fallback to product images
        String productImage = null;
        if (!variant.getVariantImages().isEmpty()) {
            productImage = variant.getVariantImages().get(0).getImageUrl();
        } else if (!product.getImages().isEmpty()) {
            productImage = product.getImages().get(0).getImageUrl();
        }

        boolean canEdit = false;
        boolean canDelete = false;

        if (currentCustomerId != null && review.getCustomer().getUserId().equals(currentCustomerId)) {
            LocalDateTime editDeadline = review.getCreatedAt().plusDays(REVIEW_EDIT_WINDOW_DAYS);
            canEdit = LocalDateTime.now().isBefore(editDeadline);
            canDelete = true;
        }

        boolean canReply = false;
        boolean canEditReply = false;

        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .customerId(review.getCustomer().getUserId())
                .customerName(review.getCustomer().getFullName())
                .productVariantId(variant.getVariantId())
                .productVariantName(variant.getName())
                .productId(product.getProductId())
                .productName(product.getName())
                .storeId(review.getStore().getStoreId())
                .storeName(review.getStore().getStoreName())
                .orderDetailId(review.getOrderDetail() != null ? review.getOrderDetail().getOrderDetailId() : null)
                .orderCode(review.getOrderDetail() != null ? review.getOrderDetail().getOrder().getOrderCode() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .imageUrl(review.getImageUrl())
                .supplierReply(review.getSupplierReply())
                .repliedAt(review.getRepliedAt())
                .markedAsSpam(review.isMarkedAsSpam())
                .createdAt(review.getCreatedAt())
                .productImage(productImage)
                .canEdit(canEdit)
                .canDelete(canDelete)
                .canReply(canReply)
                .canEditReply(canEditReply)
                .build();
    }

    @Override
    @Transactional
    public ReviewResponse replyToReview(String supplierId, String reviewId, String reply) {
        log.info("Supplier replying to review: supplierId={}, reviewId={}", supplierId, reviewId);

        // Get supplier (supplierId from JWT is keycloakId)
        Supplier supplier = supplierRepository.findByKeycloakId(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                        "Không tìm thấy nhà cung cấp"));

        // Get review
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy đánh giá"));

        // Validate: Supplier must own this store
        if (!review.getStore().getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền trả lời đánh giá của cửa hàng khác");
        }

        // Validate: Cannot reply twice
        if (review.getSupplierReply() != null) {
            throw new BadRequestException(ErrorCode.RESOURCE_ALREADY_EXISTS,
                    "Bạn đã trả lời đánh giá này rồi. Vui lòng sử dụng chức năng sửa phản hồi");
        }

        // Add reply
        review.setSupplierReply(reply);
        review.setRepliedAt(LocalDateTime.now());
        review = reviewRepository.save(review);

        log.info("Supplier replied to review successfully: reviewId={}", reviewId);
        return mapToResponse(review, null);
    }

    @Override
    @Transactional
    public ReviewResponse updateReply(String supplierId, String reviewId, String reply) {
        log.info("Supplier updating reply: supplierId={}, reviewId={}", supplierId, reviewId);

        // Get supplier (supplierId from JWT is keycloakId)
        Supplier supplier = supplierRepository.findByKeycloakId(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                        "Không tìm thấy nhà cung cấp"));

        // Get review
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy đánh giá"));

        // Validate: Supplier must own this store
        if (!review.getStore().getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền sửa phản hồi của cửa hàng khác");
        }

        // Validate: Must have existing reply
        if (review.getSupplierReply() == null) {
            throw new BadRequestException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Chưa có phản hồi để sửa");
        }

        // Check edit window (7 days from reply date)
        LocalDateTime editDeadline = review.getRepliedAt().plusDays(REVIEW_EDIT_WINDOW_DAYS);
        if (LocalDateTime.now().isAfter(editDeadline)) {
            throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Đã quá thời hạn chỉnh sửa phản hồi (7 ngày)");
        }

        // Update reply
        review.setSupplierReply(reply);
        review = reviewRepository.save(review);

        log.info("Supplier reply updated successfully: reviewId={}", reviewId);
        return mapToResponse(review, null);
    }

    @Override
    @Transactional
    public void deleteReply(String supplierId, String reviewId) {
        log.info("Supplier deleting reply: supplierId={}, reviewId={}", supplierId, reviewId);

        // Get supplier (supplierId from JWT is keycloakId)
        Supplier supplier = supplierRepository.findByKeycloakId(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                        "Không tìm thấy nhà cung cấp"));

        // Get review
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy đánh giá"));

        // Validate: Supplier must own this store
        if (!review.getStore().getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền xóa phản hồi của cửa hàng khác");
        }

        // Validate: Must have existing reply
        if (review.getSupplierReply() == null) {
            throw new BadRequestException(ErrorCode.RESOURCE_NOT_FOUND,
                    "Không có phản hồi để xóa");
        }

        // Delete reply
        review.setSupplierReply(null);
        review.setRepliedAt(null);
        reviewRepository.save(review);

        log.info("Supplier reply deleted successfully: reviewId={}", reviewId);
    }

    @Override
    @Transactional
    public void reportReview(String supplierId, String reviewId, String reason) {
        log.info("Supplier reporting review: supplierId={}, reviewId={}, reason={}", supplierId, reviewId, reason);

        // Get supplier (supplierId from JWT is keycloakId)
        Supplier supplier = supplierRepository.findByKeycloakId(supplierId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                        "Không tìm thấy nhà cung cấp"));

        // Get review
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy đánh giá"));

        // Validate: Supplier must own this store
        if (!review.getStore().getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn chỉ có thể báo cáo đánh giá trên cửa hàng của mình");
        }

        // Validate: Cannot report if already marked as spam
        if (review.isMarkedAsSpam()) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Đánh giá này đã được đánh dấu là spam");
        }

        // Automatically mark review as spam
        review.setMarkedAsSpam(true);
        reviewRepository.save(review);
        
        log.info("Review automatically marked as spam by supplier report: reviewId={}", reviewId);

        // Send notification to admins for information (not for approval)
        try {
            String notificationContent = String.format(
                    "Nhà cung cấp '%s' đã báo cáo và đánh dấu đánh giá vi phạm.\nLý do: %s\nĐánh giá: \"%s\"\nKhách hàng: %s",
                    supplier.getBusinessName() != null ? supplier.getBusinessName() : supplier.getFullName(),
                    reason,
                    review.getComment(),
                    review.getCustomer().getFullName()
            );
            
            inAppNotificationService.createNotificationForAllAdmins(
                    com.example.backend.entity.enums.NotificationType.REVIEW_REPORTED,
                    notificationContent,
                    "/admin/reviews/spam?reviewId=" + reviewId
            );
            
            log.info("Review report notification sent to admins: reviewId={}", reviewId);
        } catch (Exception e) {
            log.error("Failed to send review report notification", e);
            // Don't throw exception, report still recorded and spam marked
        }

        log.info("Review reported and marked as spam successfully: reviewId={}", reviewId);
    }
}
