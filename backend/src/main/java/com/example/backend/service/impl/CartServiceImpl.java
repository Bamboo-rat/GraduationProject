package com.example.backend.service.impl;

import com.example.backend.dto.request.AddToCartRequest;
import com.example.backend.dto.request.UpdateCartItemRequest;
import com.example.backend.dto.response.CartResponse;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.CustomerTier;
import com.example.backend.entity.enums.ProductStatus;
import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.entity.enums.PromotionTier;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.*;
import com.example.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartDetailRepository cartDetailRepository;
    private final CartPromotionRepository cartPromotionRepository;
    private final CustomerRepository customerRepository;
    private final StoreProductRepository storeProductRepository;
    private final StoreRepository storeRepository;
    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public CartResponse addToCart(String customerId, AddToCartRequest request) {
        log.info("Adding item to cart: customerId={}, storeProductId={}, quantity={}",
                customerId, request.getStoreProductId(), request.getQuantity());

        // Get customer
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Get store product
        StoreProduct storeProduct = storeProductRepository.findById(request.getStoreProductId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.PRODUCT_NOT_FOUND));

        // Validate product status and stock
        ProductVariant variant = storeProduct.getVariant();
        Product product = variant.getProduct();

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.PRODUCT_NOT_AVAILABLE,
                    "Sản phẩm không còn khả dụng");
        }

        if (variant.getExpiryDate() != null && variant.getExpiryDate().isBefore(java.time.LocalDate.now())) {
            throw new BadRequestException(ErrorCode.PRODUCT_NOT_AVAILABLE,
                    "Sản phẩm đã hết hạn");
        }

        if (storeProduct.getStockQuantity() < request.getQuantity()) {
            throw new BadRequestException(ErrorCode.INSUFFICIENT_STOCK,
                    "Số lượng tồn kho không đủ. Còn lại: " + storeProduct.getStockQuantity());
        }

        Store store = storeProduct.getStore();

        // Find or create cart for this customer-store combination
        Cart cart = cartRepository.findByCustomerAndStore(customer, store)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setCustomer(customer);
                    newCart.setStore(store);
                    newCart.setTotal(BigDecimal.ZERO);
                    return cartRepository.save(newCart);
                });

        // Check if item already exists in cart
        CartDetail cartDetail = cartDetailRepository.findByCartAndStoreProduct(cart, storeProduct)
                .orElse(null);

        if (cartDetail != null) {
            // Update existing item
            int newQuantity = cartDetail.getQuantity() + request.getQuantity();
            if (storeProduct.getStockQuantity() < newQuantity) {
                throw new BadRequestException(ErrorCode.INSUFFICIENT_STOCK,
                        "Số lượng tồn kho không đủ. Còn lại: " + storeProduct.getStockQuantity());
            }
            cartDetail.setQuantity(newQuantity);
            cartDetail.setAmount(calculateAmount(storeProduct, newQuantity));
        } else {
            // Add new item
            cartDetail = new CartDetail();
            cartDetail.setCart(cart);
            cartDetail.setStoreProduct(storeProduct);
            cartDetail.setQuantity(request.getQuantity());
            cartDetail.setAmount(calculateAmount(storeProduct, request.getQuantity()));
            cart.getCartDetails().add(cartDetail);
        }

        cartDetailRepository.save(cartDetail);

        // Recalculate cart total
        recalculateCartTotal(cart);
        cart = cartRepository.save(cart);

        log.info("Item added to cart successfully: cartId={}", cart.getCartId());
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(String customerId, String cartDetailId, UpdateCartItemRequest request) {
        log.info("Updating cart item: customerId={}, cartDetailId={}, newQuantity={}",
                customerId, cartDetailId, request.getQuantity());

        CartDetail cartDetail = cartDetailRepository.findById(cartDetailId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_ITEM_NOT_FOUND));

        Cart cart = cartDetail.getCart();

        // Verify ownership
        if (!cart.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền truy cập giỏ hàng này");
        }

        // If quantity is 0 or null, remove the item from cart
        if (request.getQuantity() == null || request.getQuantity() == 0) {
            log.info("Quantity is 0 or null, removing cart item: cartDetailId={}", cartDetailId);
            return removeCartItem(customerId, cartDetailId);
        }

        StoreProduct storeProduct = cartDetail.getStoreProduct();

        // Validate stock
        if (storeProduct.getStockQuantity() < request.getQuantity()) {
            throw new BadRequestException(ErrorCode.INSUFFICIENT_STOCK,
                    "Số lượng tồn kho không đủ. Còn lại: " + storeProduct.getStockQuantity());
        }

        // Update quantity
        cartDetail.setQuantity(request.getQuantity());
        cartDetail.setAmount(calculateAmount(storeProduct, request.getQuantity()));
        cartDetailRepository.save(cartDetail);

        // Recalculate cart total
        recalculateCartTotal(cart);
        cart = cartRepository.save(cart);

        log.info("Cart item updated successfully");
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeCartItem(String customerId, String cartDetailId) {
        log.info("Removing cart item: customerId={}, cartDetailId={}", customerId, cartDetailId);

        CartDetail cartDetail = cartDetailRepository.findById(cartDetailId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_ITEM_NOT_FOUND));

        Cart cart = cartDetail.getCart();

        // Verify ownership
        if (!cart.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền truy cập giỏ hàng này");
        }

        // Remove item
        cart.getCartDetails().remove(cartDetail);
        cartDetailRepository.delete(cartDetail);

        // Recalculate cart total
        recalculateCartTotal(cart);
        cart = cartRepository.save(cart);

        log.info("Cart item removed successfully");
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCartByStore(String customerId, String storeId) {
        log.info("Getting cart by store: customerId={}, storeId={}", customerId, storeId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORE_NOT_FOUND));

        Cart cart = cartRepository.findByCustomerAndStore(customer, store)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_NOT_FOUND));

        return mapToCartResponse(cart);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartResponse> getAllCustomerCarts(String customerId) {
        log.info("Getting all carts for customer: customerId={}", customerId);

        List<Cart> carts = cartRepository.findByCustomerId(customerId);
        return carts.stream()
                .map(this::mapToCartResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCartById(String customerId, String cartId) {
        log.info("Getting cart by ID: customerId={}, cartId={}", customerId, cartId);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_NOT_FOUND));

        // Verify ownership
        if (!cart.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền truy cập giỏ hàng này");
        }

        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public void clearCart(String customerId, String cartId) {
        log.info("Clearing cart: customerId={}, cartId={}", customerId, cartId);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_NOT_FOUND));

        // Verify ownership
        if (!cart.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền truy cập giỏ hàng này");
        }

        cartRepository.delete(cart);
        log.info("Cart cleared successfully");
    }

    @Override
    @Transactional
    public void clearAllCustomerCarts(String customerId) {
        log.info("Clearing all carts for customer: customerId={}", customerId);
        cartRepository.deleteByCustomerId(customerId);
        log.info("All carts cleared successfully");
    }

    @Override
    @Transactional
    public CartResponse validateAndSyncCart(String customerId, String cartId) {
        log.info("Validating and syncing cart: customerId={}, cartId={}", customerId, cartId);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_NOT_FOUND));

        // Verify ownership
        if (!cart.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền truy cập giỏ hàng này");
        }

        List<CartDetail> itemsToRemove = new ArrayList<>();
        List<CartDetail> itemsToUpdate = new ArrayList<>();

        // Validate each item
        for (CartDetail detail : cart.getCartDetails()) {
            StoreProduct storeProduct = detail.getStoreProduct();
            ProductVariant variant = storeProduct.getVariant();
            Product product = variant.getProduct();

            // Check if product is expired or inactive
            if (product.getStatus() != ProductStatus.ACTIVE) {
                log.warn("Removing inactive product from cart: productId={}", product.getProductId());
                itemsToRemove.add(detail);
                continue;
            }

            if (variant.getExpiryDate() != null && variant.getExpiryDate().isBefore(java.time.LocalDate.now())) {
                log.warn("Removing expired product from cart: productId={}", product.getProductId());
                itemsToRemove.add(detail);
                continue;
            }

            // Check stock availability
            if (storeProduct.getStockQuantity() <= 0) {
                log.warn("Removing out of stock product from cart: productId={}", product.getProductId());
                itemsToRemove.add(detail);
                continue;
            }

            // Adjust quantity if not enough stock
            if (detail.getQuantity() > storeProduct.getStockQuantity()) {
                log.warn("Adjusting quantity for product in cart: productId={}, requested={}, available={}",
                        product.getProductId(), detail.getQuantity(), storeProduct.getStockQuantity());
                detail.setQuantity(storeProduct.getStockQuantity());
                detail.setAmount(calculateAmount(storeProduct, storeProduct.getStockQuantity()));
                itemsToUpdate.add(detail);
            }
        }

        // Remove invalid items
        if (!itemsToRemove.isEmpty()) {
            cart.getCartDetails().removeAll(itemsToRemove);
            cartDetailRepository.deleteAll(itemsToRemove);
        }

        // Update adjusted items
        if (!itemsToUpdate.isEmpty()) {
            cartDetailRepository.saveAll(itemsToUpdate);
        }

        // Recalculate cart total
        recalculateCartTotal(cart);
        cart = cartRepository.save(cart);

        // Validate and remove promotions that no longer meet requirements
        List<CartPromotion> promotionsToRemove = validatePromotions(cart);
        if (!promotionsToRemove.isEmpty()) {
            cart.getAppliedPromotions().removeAll(promotionsToRemove);
            cartPromotionRepository.deleteAll(promotionsToRemove);
            log.info("Removed {} promotions that no longer meet requirements", promotionsToRemove.size());
        }

        log.info("Cart validated and synced: itemsRemoved={}, itemsAdjusted={}, promotionsRemoved={}",
                itemsToRemove.size(), itemsToUpdate.size(), promotionsToRemove.size());

        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse applyPromotion(String customerId, String cartId, String promotionCode) {
        log.info("Applying promotion to cart: customerId={}, cartId={}, promotionCode={}",
                customerId, cartId, promotionCode);

        // Get cart
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_NOT_FOUND));

        // Verify ownership
        if (!cart.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền truy cập giỏ hàng này");
        }

        // Find promotion
        Promotion promotion = promotionRepository.findByCode(promotionCode)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        // Check if promotion is already applied
        if (cartPromotionRepository.existsByCartAndPromotion(cart, promotion)) {
            throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                    "Mã khuyến mãi đã được áp dụng");
        }

        // Validate promotion
        validatePromotionEligibility(cart, promotion);

        // Apply promotion
        CartPromotion cartPromotion = new CartPromotion();
        cartPromotion.setCart(cart);
        cartPromotion.setPromotion(promotion);
        cartPromotionRepository.save(cartPromotion);

        cart.getAppliedPromotions().add(cartPromotion);

        log.info("Promotion applied successfully: promotionCode={}, cartId={}", promotionCode, cartId);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removePromotion(String customerId, String cartId, String promotionCode) {
        log.info("Removing promotion from cart: customerId={}, cartId={}, promotionCode={}",
                customerId, cartId, promotionCode);

        // Get cart
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_NOT_FOUND));

        // Verify ownership
        if (!cart.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền truy cập giỏ hàng này");
        }

        // Find promotion
        Promotion promotion = promotionRepository.findByCode(promotionCode)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        // Find and remove cart promotion
        CartPromotion cartPromotion = cartPromotionRepository.findByCartAndPromotion(cart, promotion)
                .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND,
                        "Mã khuyến mãi không được áp dụng trong giỏ hàng này"));

        cart.getAppliedPromotions().remove(cartPromotion);
        cartPromotionRepository.delete(cartPromotion);

        log.info("Promotion removed successfully: promotionCode={}, cartId={}", promotionCode, cartId);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public void resetAllCarts() {
        log.info("Resetting all carts (end of day)");
        cartRepository.deleteAllCarts();
        log.info("All carts reset successfully");
    }

    // Helper methods

    private BigDecimal calculateAmount(StoreProduct storeProduct, int quantity) {
        ProductVariant variant = storeProduct.getVariant();
        BigDecimal price = storeProduct.getPriceOverride() != null
                ? storeProduct.getPriceOverride()
                : (variant.getDiscountPrice() != null ? variant.getDiscountPrice() : variant.getOriginalPrice());
        return price.multiply(BigDecimal.valueOf(quantity));
    }

    private void recalculateCartTotal(Cart cart) {
        BigDecimal total = cart.getCartDetails().stream()
                .map(CartDetail::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        cart.setTotal(total);
    }

    /**
     * Validate promotions and return list of promotions that no longer meet requirements
     */
    private List<CartPromotion> validatePromotions(Cart cart) {
        List<CartPromotion> promotionsToRemove = new ArrayList<>();

        for (CartPromotion cartPromotion : cart.getAppliedPromotions()) {
            Promotion promotion = cartPromotion.getPromotion();

            // Check if promotion is still active
            if (promotion.getStatus() != PromotionStatus.ACTIVE) {
                log.warn("Promotion is no longer active: promotionCode={}", promotion.getCode());
                promotionsToRemove.add(cartPromotion);
                continue;
            }

            // Check if promotion has expired
            if (promotion.getEndDate() != null && promotion.getEndDate().isBefore(java.time.LocalDate.now())) {
                log.warn("Promotion has expired: promotionCode={}", promotion.getCode());
                promotionsToRemove.add(cartPromotion);
                continue;
            }

            // Check if promotion hasn't started yet
            if (promotion.getStartDate() != null && promotion.getStartDate().isAfter(java.time.LocalDate.now())) {
                log.warn("Promotion hasn't started yet: promotionCode={}", promotion.getCode());
                promotionsToRemove.add(cartPromotion);
                continue;
            }

            // Check minimum order amount
            if (promotion.getMinimumOrderAmount() != null &&
                cart.getTotal().compareTo(promotion.getMinimumOrderAmount()) < 0) {
                log.warn("Cart total does not meet minimum order amount: promotionCode={}, required={}, actual={}",
                        promotion.getCode(), promotion.getMinimumOrderAmount(), cart.getTotal());
                promotionsToRemove.add(cartPromotion);
                continue;
            }

            // Check usage limits (global and per customer)
            if (promotion.getTotalUsageLimit() != null) {
                // Check actual usage count from PromotionUsageRepository
                // This is more accurate than currentUsageCount field (which may have race condition issues)
                long actualUsageCount = promotionUsageRepository.countByPromotionId(promotion.getPromotionId());
                if (actualUsageCount >= promotion.getTotalUsageLimit()) {
                    log.warn("Promotion usage limit reached: code={}, limit={}, actualUsage={}",
                            promotion.getCode(), promotion.getTotalUsageLimit(), actualUsageCount);
                    promotionsToRemove.add(cartPromotion);
                    continue;
                }
            }

            // Check per-customer usage limit
            if (promotion.getUsagePerCustomerLimit() != null) {
                long customerUsageCount = promotionUsageRepository.countByPromotionAndCustomer(
                        promotion.getPromotionId(), cart.getCustomer().getUserId());
                if (customerUsageCount >= promotion.getUsagePerCustomerLimit()) {
                    log.warn("Customer reached per-customer usage limit: customerId={}, promotionCode={}, limit={}, usage={}",
                            cart.getCustomer().getUserId(), promotion.getCode(),
                            promotion.getUsagePerCustomerLimit(), customerUsageCount);
                    promotionsToRemove.add(cartPromotion);
                    continue;
                }
            }
        }

        return promotionsToRemove;
    }

    /**
     * Validate if promotion can be applied to cart
     */
    private void validatePromotionEligibility(Cart cart, Promotion promotion) {
        // Check if promotion is active
        if (promotion.getStatus() != PromotionStatus.ACTIVE) {
            throw new BadRequestException(ErrorCode.PROMOTION_EXPIRED_OR_INACTIVE,
                    "Mã khuyến mãi không hoạt động");
        }

        // Check if promotion has expired
        if (promotion.getEndDate() != null && promotion.getEndDate().isBefore(java.time.LocalDate.now())) {
            throw new BadRequestException(ErrorCode.PROMOTION_EXPIRED_OR_INACTIVE,
                    "Mã khuyến mãi đã hết hạn");
        }

        // Check if promotion hasn't started yet
        if (promotion.getStartDate() != null && promotion.getStartDate().isAfter(java.time.LocalDate.now())) {
            throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                    "Mã khuyến mãi chưa bắt đầu");
        }

        // Check minimum order amount
        if (promotion.getMinimumOrderAmount() != null &&
            cart.getTotal().compareTo(promotion.getMinimumOrderAmount()) < 0) {
            throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                    String.format("Đơn hàng tối thiểu %s để áp dụng mã này. Hiện tại: %s",
                            promotion.getMinimumOrderAmount(), cart.getTotal()));
        }

        // Check customer tier requirement
        // promotion.getTier() defines which customer tiers can use this promotion
        if (!isCustomerEligibleForPromotionTier(cart.getCustomer(), promotion)) {
            throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                    String.format("Mã khuyến mãi này dành cho %s. Cấp độ hiện tại của bạn: %s",
                            promotion.getTier().getDisplayName(),
                            cart.getCustomer().getTier().getDisplayName()));
        }

        // Check per-customer usage limits
        if (promotion.getUsagePerCustomerLimit() != null) {
            long customerUsageCount = promotionUsageRepository.countByPromotionAndCustomer(
                    promotion.getPromotionId(), cart.getCustomer().getUserId());
            if (customerUsageCount >= promotion.getUsagePerCustomerLimit()) {
                throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                        String.format("Bạn đã sử dụng hết số lần áp dụng mã này (%d/%d)",
                                customerUsageCount, promotion.getUsagePerCustomerLimit()));
            }
        }

        // Check global usage limit
        if (promotion.getTotalUsageLimit() != null) {
            long actualUsageCount = promotionUsageRepository.countByPromotionId(promotion.getPromotionId());
            if (actualUsageCount >= promotion.getTotalUsageLimit()) {
                throw new BadRequestException(ErrorCode.PROMOTION_NOT_APPLICABLE,
                        "Mã khuyến mãi đã hết lượt sử dụng");
            }
        }

    }

    /**
     * Check if customer's tier is eligible for the promotion tier requirement
     * Promotion tiers define minimum customer tier requirements:
     * - GENERAL: All customers
     * - BRONZE_PLUS: Bronze and above (Bronze, Silver, Gold, Platinum, Diamond)
     * - SILVER_PLUS: Silver and above
     * - GOLD_PLUS: Gold and above
     * - PLATINUM_PLUS: Platinum and above
     * - DIAMOND_ONLY: Diamond only
     * - BIRTHDAY: Special promotions (requires additional birthday check - not implemented here)
     * - FIRST_TIME: Special promotions (requires check if customer has previous orders - not implemented here)
     */
    private boolean isCustomerEligibleForPromotionTier(Customer customer, Promotion promotion) {
        PromotionTier promotionTier = promotion.getTier();
        CustomerTier customerTier = customer.getTier();

        return switch (promotionTier) {
            case GENERAL -> true; // All customers eligible
            case BRONZE_PLUS -> true; // All tiers are Bronze+ (Bronze, Silver, Gold, Platinum, Diamond)
            case SILVER_PLUS -> customerTier != CustomerTier.BRONZE;
            case GOLD_PLUS -> customerTier == CustomerTier.GOLD
                    || customerTier == CustomerTier.PLATINUM
                    || customerTier == CustomerTier.DIAMOND;
            case PLATINUM_PLUS -> customerTier == CustomerTier.PLATINUM
                    || customerTier == CustomerTier.DIAMOND;
            case DIAMOND_ONLY -> customerTier == CustomerTier.DIAMOND;
            case BIRTHDAY -> {
                // Birthday promotion: check if customer's birthday is in current month
                if (customer.getDateOfBirth() == null) {
                    log.warn("Customer {} has no birthday set, cannot use BIRTHDAY promotion", customer.getUserId());
                    yield false;
                }
                java.time.LocalDate now = java.time.LocalDate.now();
                boolean isBirthdayMonth = customer.getDateOfBirth().getMonth() == now.getMonth();
                if (!isBirthdayMonth) {
                    log.info("Customer {} birthday is not in current month, cannot use BIRTHDAY promotion", 
                            customer.getUserId());
                }
                yield isBirthdayMonth;
            }
            case FIRST_TIME -> {
                // First-time promotion: check if customer has any previous orders
                long orderCount = orderRepository.countByCustomer(customer);
                boolean isFirstTime = orderCount == 0;
                if (!isFirstTime) {
                    log.info("Customer {} has {} previous orders, cannot use FIRST_TIME promotion", 
                            customer.getUserId(), orderCount);
                }
                yield isFirstTime;
            }
        };
    }

    private CartResponse mapToCartResponse(Cart cart) {
        List<CartResponse.CartItemResponse> items = cart.getCartDetails().stream()
                .map(this::mapToCartItemResponse)
                .collect(Collectors.toList());

        // Get applied promotion codes
        List<String> appliedPromotions = cart.getAppliedPromotions().stream()
                .map(cp -> cp.getPromotion().getCode())
                .collect(Collectors.toList());

        return CartResponse.builder()
                .cartId(cart.getCartId())
                .customerId(cart.getCustomer().getUserId())
                .storeId(cart.getStore().getStoreId())
                .storeName(cart.getStore().getStoreName())
                .total(cart.getTotal())
                .items(items)
                .itemCount(items.size())
                .appliedPromotions(appliedPromotions)
                .build();
    }

    private CartResponse.CartItemResponse mapToCartItemResponse(CartDetail detail) {
        StoreProduct storeProduct = detail.getStoreProduct();
        ProductVariant variant = storeProduct.getVariant();
        Product product = variant.getProduct();

        BigDecimal unitPrice = storeProduct.getPriceOverride() != null
                ? storeProduct.getPriceOverride()
                : (variant.getDiscountPrice() != null ? variant.getDiscountPrice() : variant.getOriginalPrice());

        boolean isAvailable = product.getStatus() == ProductStatus.ACTIVE
                && storeProduct.getStockQuantity() > 0
                && (variant.getExpiryDate() == null || variant.getExpiryDate().isAfter(java.time.LocalDate.now()));

        String productImage = product.getImages().isEmpty()
                ? null
                : product.getImages().get(0).getImageUrl();

    return CartResponse.CartItemResponse.builder()
                .cartDetailId(detail.getCartDetailId())
                .storeProductId(storeProduct.getStoreProductId())
        .storeId(storeProduct.getStore().getStoreId())
        .productId(product.getProductId())
        .variantId(variant.getVariantId())
        .sku(variant.getSku())
                .productName(product.getName())
        .variantName(variant.getName())
                .productImage(productImage)
                .quantity(detail.getQuantity())
                .unitPrice(unitPrice)
                .amount(detail.getAmount())
                .availableStock(storeProduct.getStockQuantity())
                .isAvailable(isAvailable)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getMostRecentCart(String customerId) {
        log.info("Getting most recent cart for customer: customerId={}", customerId);

        Cart cart = cartRepository.findMostRecentCartByCustomerId(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_NOT_FOUND,
                        "Không tìm thấy giỏ hàng nào"));

        log.info("Found most recent cart: cartId={}, updatedAt={}", cart.getCartId(), cart.getUpdatedAt());
        return mapToCartResponse(cart);
    }
}
