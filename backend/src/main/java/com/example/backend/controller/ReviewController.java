package com.example.backend.controller;

import com.example.backend.dto.request.CreateReviewRequest;
import com.example.backend.dto.request.UpdateReviewRequest;
import com.example.backend.dto.response.ProductRatingResponse;
import com.example.backend.dto.response.ReviewResponse;
import com.example.backend.entity.enums.StorageBucket;
import com.example.backend.service.FileStorageService;
import com.example.backend.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Review Management", description = "APIs for managing product reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final FileStorageService fileStorageService;

    // ==================== CUSTOMER ENDPOINTS ====================

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(
            summary = "Create a product review",
            description = "Customer creates a review for a delivered order item. Earns bonus points.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ReviewResponse> createReview(
            Authentication authentication,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        String customerId = authentication.getName();
        log.info("Creating review: customerId={}, request={}", customerId, request);
        
        ReviewResponse response = reviewService.createReview(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(
            summary = "Update a review",
            description = "Customer updates their own review (within 7 days of creation)",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ReviewResponse> updateReview(
            Authentication authentication,
            @PathVariable String reviewId,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        String customerId = authentication.getName();
        log.info("Updating review: customerId={}, reviewId={}", customerId, reviewId);
        
        ReviewResponse response = reviewService.updateReview(customerId, reviewId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(
            summary = "Delete a review",
            description = "Customer deletes their own review",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Void> deleteReview(
            Authentication authentication,
            @PathVariable String reviewId
    ) {
        String customerId = authentication.getName();
        log.info("Deleting review: customerId={}, reviewId={}", customerId, reviewId);
        
        reviewService.deleteReview(customerId, reviewId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(
            summary = "Get my reviews",
            description = "Customer retrieves their own reviews with pagination",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Page<ReviewResponse>> getMyReviews(
            Authentication authentication,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size
    ) {
        String customerId = authentication.getName();
        log.info("Getting reviews by customer: customerId={}, page={}, size={}", customerId, page, size);
        
        Page<ReviewResponse> reviews = reviewService.getCustomerReviews(customerId, page, size);
        return ResponseEntity.ok(reviews);
    }

    // ==================== PUBLIC ENDPOINTS ====================

    @GetMapping("/{reviewId}")
    @Operation(
            summary = "Get review by ID",
            description = "Public endpoint to get a single review details"
    )
    public ResponseEntity<ReviewResponse> getReviewById(@PathVariable String reviewId) {
        log.info("Getting review by ID: reviewId={}", reviewId);
        
        ReviewResponse response = reviewService.getReviewById(reviewId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/product/{productVariantId}")
    @Operation(
            summary = "Get product variant reviews",
            description = "Public endpoint to get all reviews for a product variant with optional rating filter"
    )
    public ResponseEntity<Page<ReviewResponse>> getProductReviews(
            @PathVariable String productVariantId,
            @Parameter(description = "Filter by rating (1-5)") @RequestParam(required = false) Integer rating,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size
    ) {
        log.info("Getting reviews by product variant: variantId={}, rating={}, page={}, size={}", 
                productVariantId, rating, page, size);
        
        Page<ReviewResponse> reviews = reviewService.getProductReviews(productVariantId, rating, page, size);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/product/{productVariantId}/rating")
    @Operation(
            summary = "Get product variant rating statistics",
            description = "Public endpoint to get average rating and distribution for a product variant"
    )
    public ResponseEntity<ProductRatingResponse> getProductRating(@PathVariable String productVariantId) {
        log.info("Getting product variant rating: variantId={}", productVariantId);
        
        ProductRatingResponse response = reviewService.getProductRating(productVariantId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/store/{storeId}")
    @Operation(
            summary = "Get store reviews",
            description = "Public endpoint to get all reviews for a store"
    )
    public ResponseEntity<Page<ReviewResponse>> getStoreReviews(
            @PathVariable String storeId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size
    ) {
        log.info("Getting reviews by store: storeId={}, page={}, size={}", storeId, page, size);
        
        Page<ReviewResponse> reviews = reviewService.getStoreReviews(storeId, page, size);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/product/{productVariantId}/search")
    @Operation(
            summary = "Search reviews by keyword",
            description = "Public endpoint to search reviews for a product variant by comment keyword"
    )
    public ResponseEntity<Page<ReviewResponse>> searchReviews(
            @PathVariable String productVariantId,
            @Parameter(description = "Search keyword in review comments") @RequestParam String keyword,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size
    ) {
        log.info("Searching reviews: variantId={}, keyword={}, page={}, size={}", 
                productVariantId, keyword, page, size);
        
        Page<ReviewResponse> reviews = reviewService.searchReviews(productVariantId, keyword, page, size);
        return ResponseEntity.ok(reviews);
    }

    // ==================== ADMIN ENDPOINTS ====================

    @PatchMapping("/admin/{reviewId}/spam")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(
            summary = "Mark/unmark review as spam",
            description = "Admin marks a review as spam or removes spam flag",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ReviewResponse> markAsSpam(
            @PathVariable String reviewId,
            @Parameter(description = "True to mark as spam, false to unmark") @RequestParam boolean isSpam
    ) {
        log.info("Marking review as spam: reviewId={}, isSpam={}", reviewId, isSpam);
        
        ReviewResponse response = reviewService.markAsSpam(reviewId, isSpam);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/spam")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(
            summary = "Get spam reviews",
            description = "Admin retrieves all reviews marked as spam for moderation",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Page<ReviewResponse>> getSpamReviews(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Getting spam reviews: page={}, size={}", page, size);
        
        Page<ReviewResponse> reviews = reviewService.getSpamReviews(page, size);
        return ResponseEntity.ok(reviews);
    }

    // ==================== SUPPLIER ENDPOINTS ====================

    @PostMapping("/{reviewId}/reply")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Supplier replies to a review",
            description = "Supplier adds a reply to a customer review for their store's product",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ReviewResponse> replyToReview(
            Authentication authentication,
            @PathVariable String reviewId,
            @Valid @RequestBody com.example.backend.dto.request.ReplyReviewRequest request
    ) {
        String supplierId = authentication.getName();
        log.info("Supplier replying to review: supplierId={}, reviewId={}", supplierId, reviewId);
        
        ReviewResponse response = reviewService.replyToReview(supplierId, reviewId, request.getReply());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{reviewId}/reply")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Supplier updates their reply",
            description = "Supplier updates their reply to a review (within 7 days)",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ReviewResponse> updateReply(
            Authentication authentication,
            @PathVariable String reviewId,
            @Valid @RequestBody com.example.backend.dto.request.ReplyReviewRequest request
    ) {
        String supplierId = authentication.getName();
        log.info("Supplier updating reply: supplierId={}, reviewId={}", supplierId, reviewId);
        
        ReviewResponse response = reviewService.updateReply(supplierId, reviewId, request.getReply());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{reviewId}/reply")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Supplier deletes their reply",
            description = "Supplier removes their reply from a review",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Void> deleteReply(
            Authentication authentication,
            @PathVariable String reviewId
    ) {
        String supplierId = authentication.getName();
        log.info("Supplier deleting reply: supplierId={}, reviewId={}", supplierId, reviewId);
        
        reviewService.deleteReply(supplierId, reviewId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{reviewId}/report")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(
            summary = "Supplier reports a review",
            description = "Supplier reports a review as spam, inappropriate, or violating guidelines. Review will be automatically marked as spam.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Map<String, String>> reportReview(
            Authentication authentication,
            @PathVariable String reviewId,
            @Parameter(description = "Reason for reporting") @RequestParam String reason
    ) {
        String supplierId = authentication.getName();
        log.info("Supplier reporting review: supplierId={}, reviewId={}, reason={}", supplierId, reviewId, reason);
        
        reviewService.reportReview(supplierId, reviewId, reason);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đánh giá đã được đánh dấu là vi phạm và ẩn khỏi hiển thị.");
        return ResponseEntity.ok(response);
    }

    // ==================== FILE UPLOAD ENDPOINT ====================

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(
            summary = "Upload review image to cloud storage",
            description = "Customer uploads image for review. Returns image URL to use in createReview/updateReview.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<Map<String, String>> uploadReviewImage(
            Authentication authentication,
            @Parameter(description = "Image file (JPG, PNG, GIF, WebP)") 
            @RequestParam("file") MultipartFile file
    ) {
        String customerId = authentication.getName();
        log.info("Uploading review image: customerId={}, fileName={}, size={} bytes", 
                customerId, file.getOriginalFilename(), file.getSize());
        
        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File không được để trống"));
        }
        
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)"));
        }
        
        // Validate file size (max 5MB)
        long maxSize = 5 * 1024 * 1024; // 5MB
        if (file.getSize() > maxSize) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Kích thước file không được vượt quá 5MB"));
        }
        
        try {
            // Upload to Cloudinary
            String imageUrl = fileStorageService.uploadFile(file, StorageBucket.REVIEW_IMAGES);
            
            log.info("Review image uploaded successfully: customerId={}, imageUrl={}", 
                    customerId, imageUrl);
            
            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", imageUrl);
            response.put("message", "Upload thành công");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to upload review image: customerId={}", customerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload thất bại: " + e.getMessage()));
        }
    }
}
