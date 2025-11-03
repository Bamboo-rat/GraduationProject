package com.example.backend.controller;

import com.example.backend.dto.request.CancelOrderRequest;
import com.example.backend.dto.request.CheckoutRequest;
import com.example.backend.dto.request.UpdateOrderStatusRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.OrderResponse;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Order", description = "Order management endpoints for cart-to-order process")
public class OrderController {

    private final OrderService orderService;

    // ===== CUSTOMER ENDPOINTS =====

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Checkout cart and create order",
               description = "Creates order from cart, validates inventory, applies promotions, creates payment record, and clears cart")
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("POST /api/orders/checkout - Checkout: customerId={}, cartId={}", customerId, request.getCartId());

        OrderResponse response = orderService.checkout(customerId, request);
        return ResponseEntity.ok(ApiResponse.success("Đặt hàng thành công", response));
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Get customer orders", description = "Get all orders for logged-in customer with pagination and status filter")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getMyOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        String customerId = extractUserId(authentication);
        log.info("GET /api/orders/my-orders - Getting customer orders: customerId={}, status={}", customerId, status);

        Page<OrderResponse> response = orderService.getCustomerOrders(customerId, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN', 'STAFF')")
    @Operation(summary = "Get order by ID", description = "Get order details by order ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable String orderId) {
        log.info("GET /api/orders/{} - Getting order", orderId);

        OrderResponse response = orderService.getOrderById(orderId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin đơn hàng thành công", response));
    }

    @GetMapping("/code/{orderCode}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN', 'STAFF')")
    @Operation(summary = "Get order by code", description = "Get order details by order code")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByCode(
            @PathVariable String orderCode) {
        log.info("GET /api/orders/code/{} - Getting order by code", orderCode);

        OrderResponse response = orderService.getOrderByCode(orderCode);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin đơn hàng thành công", response));
    }

    @PostMapping("/{orderId}/cancel")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER')")
    @Operation(summary = "Cancel order",
               description = "Cancel order. Allowed for PENDING/CONFIRMED. Returns inventory, processes refund if applicable, records violation if customer fault")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable String orderId,
            @Valid @RequestBody CancelOrderRequest request,
            Authentication authentication) {
        String userId = extractUserId(authentication);
        log.info("POST /api/orders/{}/cancel - Canceling order: userId={}", orderId, userId);

        OrderResponse response = orderService.cancelOrder(userId, orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Đơn hàng đã được hủy", response));
    }

    // ===== SUPPLIER ENDPOINTS =====

    @GetMapping("/store/{storeId}")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Get store orders", description = "Get all orders for a specific store with pagination and status filter")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getStoreOrders(
            @PathVariable String storeId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/orders/store/{} - Getting store orders: status={}", storeId, status);

        Page<OrderResponse> response = orderService.getStoreOrders(storeId, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }

    @PostMapping("/{orderId}/confirm")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Confirm order", description = "Confirm order (PENDING → CONFIRMED). For COD orders or after payment success")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmOrder(
            @PathVariable String orderId) {
        log.info("POST /api/orders/{}/confirm - Confirming order", orderId);

        OrderResponse response = orderService.confirmOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success("Đơn hàng đã được xác nhận", response));
    }

    @PostMapping("/{orderId}/prepare")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Start preparing order", description = "Start preparing order (CONFIRMED → PREPARING)")
    public ResponseEntity<ApiResponse<OrderResponse>> startPreparing(
            @PathVariable String orderId) {
        log.info("POST /api/orders/{}/prepare - Starting order preparation", orderId);

        OrderResponse response = orderService.startPreparing(orderId);
        return ResponseEntity.ok(ApiResponse.success("Đã bắt đầu chuẩn bị đơn hàng", response));
    }

    @PostMapping("/{orderId}/ship")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Start shipping order", description = "Start shipping order (PREPARING → SHIPPING). Creates shipment record with tracking number")
    public ResponseEntity<ApiResponse<OrderResponse>> startShipping(
            @PathVariable String orderId,
            @RequestParam String trackingNumber,
            @RequestParam String shippingProvider) {
        log.info("POST /api/orders/{}/ship - Starting shipment: trackingNumber={}", orderId, trackingNumber);

        OrderResponse response = orderService.startShipping(orderId, trackingNumber, shippingProvider);
        return ResponseEntity.ok(ApiResponse.success("Đơn hàng đang được giao", response));
    }

    @PostMapping("/{orderId}/deliver")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN', 'MODERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Mark order as delivered",
               description = "Mark order as delivered (SHIPPING → DELIVERED). Awards points, updates wallet, enables reviews")
    public ResponseEntity<ApiResponse<OrderResponse>> markAsDelivered(
            @PathVariable String orderId) {
        log.info("POST /api/orders/{}/deliver - Marking order as delivered", orderId);

        OrderResponse response = orderService.markAsDelivered(orderId);
        return ResponseEntity.ok(ApiResponse.success("Đơn hàng đã được giao thành công", response));
    }

    // ===== ADMIN ENDPOINTS =====

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR', 'SUPER_ADMIN', 'STAFF')")
    @Operation(summary = "Get all orders (Admin)", description = "Get all orders with pagination and status filter")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/orders/all - Getting all orders: status={}", status);

        Page<OrderResponse> response = orderService.getAllOrders(status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }

    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Update order status (Admin)", description = "Update order status with validation of status transitions")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        log.info("PUT /api/orders/{}/status - Updating order status: newStatus={}", orderId, request.getStatus());

        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái đơn hàng thành công", response));
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR', 'SUPER_ADMIN', 'STAFF')")
    @Operation(summary = "Get orders by date range (Admin)", description = "Get orders within specific date range for reporting")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("GET /api/orders/date-range - Getting orders: startDate={}, endDate={}", startDate, endDate);

        List<OrderResponse> response = orderService.getOrdersByDateRange(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }

    // ===== PAYMENT CALLBACK ENDPOINTS =====

    @PostMapping("/{orderId}/payment/callback")
    @Operation(summary = "Payment callback", description = "Webhook endpoint for payment gateway callback (VNPay, Momo, etc.)")
    public ResponseEntity<ApiResponse<OrderResponse>> paymentCallback(
            @PathVariable String orderId,
            @RequestParam String transactionId,
            @RequestParam boolean success) {
        log.info("POST /api/orders/{}/payment/callback - Payment callback: transactionId={}, success={}",
                orderId, transactionId, success);

        OrderResponse response = orderService.processPaymentCallback(orderId, transactionId, success);
        return ResponseEntity.ok(ApiResponse.success("Xử lý callback thanh toán thành công", response));
    }

    @PostMapping("/{orderId}/refund")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Process refund (Admin)", description = "Process refund for canceled order with online payment")
    public ResponseEntity<ApiResponse<Void>> processRefund(
            @PathVariable String orderId) {
        log.info("POST /api/orders/{}/refund - Processing refund", orderId);

        orderService.processRefund(orderId);
        return ResponseEntity.ok(ApiResponse.success("Hoàn tiền thành công"));
    }

    private String extractUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getClaim("userId");
    }
}
