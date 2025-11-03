package com.example.backend.service.impl;

import com.example.backend.dto.request.AddToCartRequest;
import com.example.backend.dto.request.UpdateCartItemRequest;
import com.example.backend.dto.response.CartResponse;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.ProductStatus;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartDetailRepository cartDetailRepository;
    private final CustomerRepository customerRepository;
    private final StoreProductRepository storeProductRepository;
    private final StoreRepository storeRepository;

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

        if (product.getExpiryDate() != null && product.getExpiryDate().isBefore(LocalDateTime.now())) {
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

            if (product.getExpiryDate() != null && product.getExpiryDate().isBefore(LocalDateTime.now())) {
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

        log.info("Cart validated and synced: itemsRemoved={}, itemsAdjusted={}",
                itemsToRemove.size(), itemsToUpdate.size());

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
                : variant.getPrice();
        return price.multiply(BigDecimal.valueOf(quantity));
    }

    private void recalculateCartTotal(Cart cart) {
        BigDecimal total = cart.getCartDetails().stream()
                .map(CartDetail::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        cart.setTotal(total);
    }

    private CartResponse mapToCartResponse(Cart cart) {
        List<CartResponse.CartItemResponse> items = cart.getCartDetails().stream()
                .map(this::mapToCartItemResponse)
                .collect(Collectors.toList());

        return CartResponse.builder()
                .cartId(cart.getCartId())
                .customerId(cart.getCustomer().getUserId())
                .storeId(cart.getStore().getStoreId())
                .storeName(cart.getStore().getStoreName())
                .total(cart.getTotal())
                .items(items)
                .itemCount(items.size())
                .appliedPromotions(new ArrayList<>()) // TODO: Implement promotion application
                .build();
    }

    private CartResponse.CartItemResponse mapToCartItemResponse(CartDetail detail) {
        StoreProduct storeProduct = detail.getStoreProduct();
        ProductVariant variant = storeProduct.getVariant();
        Product product = variant.getProduct();

        BigDecimal unitPrice = storeProduct.getPriceOverride() != null
                ? storeProduct.getPriceOverride()
                : variant.getPrice();

        boolean isAvailable = product.getStatus() == ProductStatus.ACTIVE
                && storeProduct.getStockQuantity() > 0
                && (product.getExpiryDate() == null || product.getExpiryDate().isAfter(LocalDateTime.now()));

        String productImage = product.getProductImages().isEmpty()
                ? null
                : product.getProductImages().get(0).getImageUrl();

        return CartResponse.CartItemResponse.builder()
                .cartDetailId(detail.getCartDetailId())
                .storeProductId(storeProduct.getStoreProductId())
                .productName(product.getName())
                .variantName(variant.getSku())
                .productImage(productImage)
                .quantity(detail.getQuantity())
                .unitPrice(unitPrice)
                .amount(detail.getAmount())
                .availableStock(storeProduct.getStockQuantity())
                .isAvailable(isAvailable)
                .build();
    }
}
