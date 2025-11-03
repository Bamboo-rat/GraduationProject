package com.example.backend.controller;

import com.example.backend.dto.request.AddToCartRequest;
import com.example.backend.dto.request.UpdateCartItemRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.CartResponse;
import com.example.backend.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Cart management endpoints for customers")
public class CartController {

    private final CartService cartService;

    @PostMapping("/add")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Add item to cart", description = "Add product to cart. Creates new cart if doesn't exist for that store. Enforces one cart per customer per store.")
    public ResponseEntity<ApiResponse<CartResponse>> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("POST /api/cart/add - Adding item to cart: customerId={}", customerId);

        CartResponse response = cartService.addToCart(customerId, request);
        return ResponseEntity.ok(ApiResponse.success("Đã thêm sản phẩm vào giỏ hàng", response));
    }

    @PutMapping("/items/{cartDetailId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Update cart item quantity", description = "Update quantity of item in cart")
    public ResponseEntity<ApiResponse<CartResponse>> updateCartItem(
            @PathVariable String cartDetailId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("PUT /api/cart/items/{} - Updating cart item: customerId={}", cartDetailId, customerId);

        CartResponse response = cartService.updateCartItem(customerId, cartDetailId, request);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật số lượng", response));
    }

    @DeleteMapping("/items/{cartDetailId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Remove item from cart", description = "Remove specific item from cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeCartItem(
            @PathVariable String cartDetailId,
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("DELETE /api/cart/items/{} - Removing cart item: customerId={}", cartDetailId, customerId);

        CartResponse response = cartService.removeCartItem(customerId, cartDetailId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sản phẩm khỏi giỏ hàng", response));
    }

    @GetMapping("/{cartId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get cart by ID", description = "Get specific cart by cart ID")
    public ResponseEntity<ApiResponse<CartResponse>> getCartById(
            @PathVariable String cartId,
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("GET /api/cart/{} - Getting cart: customerId={}", cartId, customerId);

        CartResponse response = cartService.getCartById(customerId, cartId);
        return ResponseEntity.ok(ApiResponse.success("Lấy giỏ hàng thành công", response));
    }

    @GetMapping("/store/{storeId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get cart by store", description = "Get customer's cart for specific store")
    public ResponseEntity<ApiResponse<CartResponse>> getCartByStore(
            @PathVariable String storeId,
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("GET /api/cart/store/{} - Getting cart by store: customerId={}", storeId, customerId);

        CartResponse response = cartService.getCartByStore(customerId, storeId);
        return ResponseEntity.ok(ApiResponse.success("Lấy giỏ hàng thành công", response));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get all customer carts", description = "Get all carts for customer (multi-store carts)")
    public ResponseEntity<ApiResponse<List<CartResponse>>> getAllCustomerCarts(
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("GET /api/cart/all - Getting all carts: customerId={}", customerId);

        List<CartResponse> response = cartService.getAllCustomerCarts(customerId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách giỏ hàng thành công", response));
    }

    @PostMapping("/{cartId}/validate")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Validate cart before checkout", description = "Validates cart and removes expired/out of stock items, checks promotion eligibility")
    public ResponseEntity<ApiResponse<CartResponse>> validateCart(
            @PathVariable String cartId,
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("POST /api/cart/{}/validate - Validating cart: customerId={}", cartId, customerId);

        CartResponse response = cartService.validateAndSyncCart(customerId, cartId);
        return ResponseEntity.ok(ApiResponse.success("Giỏ hàng đã được kiểm tra", response));
    }

    @DeleteMapping("/{cartId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Clear cart", description = "Clear specific cart")
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @PathVariable String cartId,
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("DELETE /api/cart/{} - Clearing cart: customerId={}", cartId, customerId);

        cartService.clearCart(customerId, cartId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa giỏ hàng"));
    }

    @DeleteMapping("/clear-all")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Clear all customer carts", description = "Clear all carts for customer")
    public ResponseEntity<ApiResponse<Void>> clearAllCarts(
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("DELETE /api/cart/clear-all - Clearing all carts: customerId={}", customerId);

        cartService.clearAllCustomerCarts(customerId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tất cả giỏ hàng"));
    }

    private String extractUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getClaim("userId");
    }
}
