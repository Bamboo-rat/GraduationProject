package com.example.backend.service;

import com.example.backend.dto.request.AddToCartRequest;
import com.example.backend.dto.request.UpdateCartItemRequest;
import com.example.backend.dto.response.CartResponse;

import java.util.List;

/**
 * Service interface for cart management
 */
public interface CartService {

    /**
     * Add item to cart (creates new cart if doesn't exist for that store)
     * Enforces one cart per customer per store constraint
     */
    CartResponse addToCart(String customerId, AddToCartRequest request);

    /**
     * Update cart item quantity
     */
    CartResponse updateCartItem(String customerId, String cartDetailId, UpdateCartItemRequest request);

    /**
     * Remove item from cart
     */
    CartResponse removeCartItem(String customerId, String cartDetailId);

    /**
     * Get customer's cart for a specific store
     */
    CartResponse getCartByStore(String customerId, String storeId);

    /**
     * Get all carts for customer (multi-store carts)
     */
    List<CartResponse> getAllCustomerCarts(String customerId);

    /**
     * Get cart by cart ID
     */
    CartResponse getCartById(String customerId, String cartId);

    /**
     * Clear specific cart
     */
    void clearCart(String customerId, String cartId);

    /**
     * Clear all carts for customer
     */
    void clearAllCustomerCarts(String customerId);

    /**
     * Validate cart before checkout (removes expired/out of stock items, checks promotion eligibility)
     */
    CartResponse validateAndSyncCart(String customerId, String cartId);

    /**
     * Apply promotion to cart (validates eligibility and minimum order amount)
     */
    CartResponse applyPromotion(String customerId, String cartId, String promotionCode);

    /**
     * Remove promotion from cart
     */
    CartResponse removePromotion(String customerId, String cartId, String promotionCode);

    /**
     * End of day reset - clear all carts (scheduled task)
     */
    void resetAllCarts();
}
