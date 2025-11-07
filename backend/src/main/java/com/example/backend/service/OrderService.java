package com.example.backend.service;

import com.example.backend.dto.request.CancelOrderRequest;
import com.example.backend.dto.request.CheckoutRequest;
import com.example.backend.dto.request.UpdateOrderStatusRequest;
import com.example.backend.dto.response.OrderResponse;
import com.example.backend.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service interface for order management
 */
public interface OrderService {

    /**
     * Checkout cart and create order
     * - Validates cart inventory
     * - Creates order with PENDING status
     * - Copies cart details to order details
     * - Applies promotions if eligible
     * - Creates payment record
     * - Clears cart after successful checkout
     */
    OrderResponse checkout(String customerId, CheckoutRequest request);

    /**
     * Update order status (PENDING → CONFIRMED → PREPARING → SHIPPING → DELIVERED)
     * - Validates status transition
     * - Sends notification on status change
     * - Triggers wallet/points updates on DELIVERED
     */
    OrderResponse updateOrderStatus(String orderId, UpdateOrderStatusRequest request);

    /**
     * Confirm order (PENDING → CONFIRMED)
     * - For COD: supplier accepts order
     * - For online payment: payment success
     */
    OrderResponse confirmOrder(String orderId);

    /**
     * Start preparing order (CONFIRMED → PREPARING)
     */
    OrderResponse startPreparing(String orderId);

    /**
     * Start shipping order (PREPARING → SHIPPING)
     * - Creates shipment record
     * - Assigns tracking number
     */
    OrderResponse startShipping(String orderId, String trackingNumber, String shippingProvider);

    /**
     * Mark order as delivered (SHIPPING → DELIVERED)
     * - Awards bonus points (5% of order value)
     * - Records supplier wallet pending balance
     * - Enables customer reviews
     * - Updates FavoriteStore metrics
     */
    OrderResponse markAsDelivered(String orderId);

    /**
     * Cancel order
     * - Allowed when status is PENDING or CONFIRMED
     * - From PREPARING onwards, requires cancellation request approval
     * - Returns inventory
     * - Refunds payment if applicable
     * - Records customer violation if customerFault=true
     */
    OrderResponse cancelOrder(String customerId, String orderId, CancelOrderRequest request);

    /**
     * Get order by ID
     */
    OrderResponse getOrderById(String orderId);

    /**
     * Get order by order code
     */
    OrderResponse getOrderByCode(String orderCode);

    /**
     * Get customer orders with pagination and filters
     */
    Page<OrderResponse> getCustomerOrders(String customerId, OrderStatus status, int page, int size);

    /**
     * Get supplier's store orders with pagination and filters
     */
    Page<OrderResponse> getSupplierOrders(String supplierId, OrderStatus status, int page, int size);

    /**
     * Get store orders with pagination and filters
     */
    Page<OrderResponse> getStoreOrders(String storeId, OrderStatus status, int page, int size);

    /**
     * Get all orders with pagination and filters (admin)
     */
    Page<OrderResponse> getAllOrders(OrderStatus status, int page, int size);

    /**
     * Get orders within date range
     */
    List<OrderResponse> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Process payment callback (for online payment)
     */
    OrderResponse processPaymentCallback(String orderId, String transactionId, boolean success);

    /**
     * Process refund (for canceled orders with online payment)
     */
    void processRefund(String orderId);

    // NOTE: Shipping partner demo methods moved to ShippingPartnerDemoService
    // to avoid duplication and maintain clear separation of concerns.
}
