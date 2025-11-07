package com.example.backend.service.impl;

import com.example.backend.dto.request.CancelOrderRequest;
import com.example.backend.dto.request.CheckoutRequest;
import com.example.backend.dto.request.UpdateOrderStatusRequest;
import com.example.backend.dto.response.OrderResponse;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.*;
import com.example.backend.service.AutomatedSuspensionService;
import com.example.backend.service.InAppNotificationService;
import com.example.backend.service.OrderService;
import com.example.backend.service.SystemConfigService;
import com.example.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final CartRepository cartRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final StoreProductRepository storeProductRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final PromotionRepository promotionRepository;
    private final InAppNotificationService inAppNotificationService;
    private final AutomatedSuspensionService automatedSuspensionService;
    private final WalletService walletService;
    private final SystemConfigService systemConfigService;
    private final PointTransactionRepository pointTransactionRepository;
    private final FavoriteStoreRepository favoriteStoreRepository;

    private static final String CONFIG_KEY_POINTS_PERCENTAGE = "points.reward.percentage";
    private static final BigDecimal DEFAULT_POINTS_PERCENTAGE = new BigDecimal("0.05"); // 5% default

    /**
     * Get points reward percentage from system config
     * @return BigDecimal percentage (e.g., 0.05 for 5%)
     */
    private BigDecimal getPointsPercentage() {
        return systemConfigService.getConfigValueAsDecimal(
                CONFIG_KEY_POINTS_PERCENTAGE,
                DEFAULT_POINTS_PERCENTAGE
        );
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public OrderResponse checkout(String customerId, CheckoutRequest request) {
        log.info("Processing checkout: customerId={}, cartId={}", customerId, request.getCartId());

        // Get cart
        Cart cart = cartRepository.findById(request.getCartId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_NOT_FOUND));

        // Verify ownership
        if (!cart.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền truy cập giỏ hàng này");
        }

        // Validate cart has items
        if (cart.getCartDetails().isEmpty()) {
            throw new BadRequestException(ErrorCode.CART_IS_EMPTY,
                    "Giỏ hàng trống");
        }

        // Validate inventory and recalculate prices with current prices
        List<CartDetail> itemsToRemove = new ArrayList<>();
        BigDecimal orderTotal = BigDecimal.ZERO;
        
        for (CartDetail detail : cart.getCartDetails()) {
            StoreProduct storeProduct = detail.getStoreProduct();
            ProductVariant variant = storeProduct.getVariant();
            Product product = variant.getProduct();

            // Check product status
            if (product.getStatus() != ProductStatus.ACTIVE) {
                itemsToRemove.add(detail);
                continue;
            }

            // Check expiry
            if (variant.getExpiryDate() != null && variant.getExpiryDate().isBefore(java.time.LocalDate.now())) {
                itemsToRemove.add(detail);
                continue;
            }

            // Check stock
            if (storeProduct.getStockQuantity() < detail.getQuantity()) {
                throw new BadRequestException(ErrorCode.INSUFFICIENT_STOCK,
                        String.format("Sản phẩm '%s' không đủ số lượng. Còn lại: %d",
                                product.getName(), storeProduct.getStockQuantity()));
            }
            
            // Recalculate amount with current price (not cart's old price)
            BigDecimal currentUnitPrice = storeProduct.getPriceOverride() != null
                    ? storeProduct.getPriceOverride()
                    : (variant.getDiscountPrice() != null ? variant.getDiscountPrice() : variant.getOriginalPrice());
            BigDecimal itemAmount = currentUnitPrice.multiply(BigDecimal.valueOf(detail.getQuantity()));
            orderTotal = orderTotal.add(itemAmount);
        }

        if (!itemsToRemove.isEmpty()) {
            throw new BadRequestException(ErrorCode.CART_HAS_INVALID_ITEMS,
                    "Giỏ hàng có sản phẩm không hợp lệ. Vui lòng kiểm tra lại");
        }

        // Create order with recalculated total
        Order order = new Order();
        order.setOrderCode(generateOrderCode());
        order.setCustomer(cart.getCustomer());
        order.setStore(cart.getStore());
        order.setTotalAmount(orderTotal); // Use recalculated total, not cart.getTotal()
        order.setShippingFee(request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO);
        order.setDiscount(BigDecimal.ZERO); // Will be updated if promotions applied
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setShippingAddress(request.getShippingAddress());
        order.setNote(request.getNote());
        order = orderRepository.save(order);

        // Copy cart details to order details with current prices
        for (CartDetail cartDetail : cart.getCartDetails()) {
            StoreProduct storeProduct = cartDetail.getStoreProduct();
            ProductVariant variant = storeProduct.getVariant();
            
            // Calculate current unit price and amount
            BigDecimal currentUnitPrice = storeProduct.getPriceOverride() != null
                    ? storeProduct.getPriceOverride()
                    : (variant.getDiscountPrice() != null ? variant.getDiscountPrice() : variant.getOriginalPrice());
            BigDecimal itemAmount = currentUnitPrice.multiply(BigDecimal.valueOf(cartDetail.getQuantity()));
            
            OrderDetail orderDetail = new OrderDetail();
            orderDetail.setOrder(order);
            orderDetail.setStoreProduct(cartDetail.getStoreProduct());
            orderDetail.setQuantity(cartDetail.getQuantity());
            orderDetail.setAmount(itemAmount); // Use current price, not cartDetail.getAmount()
            order.getOrderDetails().add(orderDetail);
            orderDetailRepository.save(orderDetail);

            // Deduct stock
            storeProduct.setStockQuantity(storeProduct.getStockQuantity() - cartDetail.getQuantity());
            storeProductRepository.save(storeProduct);
        }

        // Apply promotions if provided (this will update order.totalAmount)
        BigDecimal totalDiscount = BigDecimal.ZERO;
        if (request.getPromotionCodes() != null && !request.getPromotionCodes().isEmpty()) {
            totalDiscount = applyPromotions(order, request.getPromotionCodes());
            order.setDiscount(totalDiscount); // Save discount amount
            orderRepository.save(order);
        }

        // Add shipping fee to final total
        BigDecimal finalTotal = order.getTotalAmount().add(order.getShippingFee());
        order.setTotalAmount(finalTotal);
        order = orderRepository.save(order);

        // Create payment record with final amount after discount
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setMethod(request.getPaymentMethod());
        payment.setAmount(order.getTotalAmount()); // Amount after discount
        payment.setStatus(PaymentStatus.PENDING);

        if (request.getPaymentMethod() == PaymentMethod.E_WALLET) {
            payment.setProvider(PaymentProvider.VNPAY); // Default to VNPay
        } else if (request.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
            payment.setProvider(PaymentProvider.INTERNAL); // Internal system for bank transfers
        }

        paymentRepository.save(payment);
        order.setPayment(payment);

        // Clear cart after successful checkout
        cartRepository.delete(cart);

        log.info("Checkout completed successfully: orderId={}, orderCode={}",
                order.getOrderId(), order.getOrderCode());

        // Send notification to customer
        sendOrderNotification(order,
                String.format("Đơn hàng #%s của bạn đã được tạo thành công. Tổng tiền: %s VNĐ",
                        order.getOrderCode(), order.getTotalAmount()));

        // Send notification to supplier about new order
        sendOrderNotificationToSupplier(order,
                String.format("Bạn có đơn hàng mới #%s. Tổng tiền: %s VNĐ. Vui lòng xác nhận đơn hàng",
                        order.getOrderCode(), order.getTotalAmount()));

        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(String orderId, UpdateOrderStatusRequest request) {
        log.info("Updating order status: orderId={}, newStatus={}", orderId, request.getStatus());

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        OrderStatus oldStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        // Validate status transition
        validateStatusTransition(oldStatus, newStatus);

        order.setStatus(newStatus);
        
        // Set timestamp based on status
        switch (newStatus) {
            case CONFIRMED -> order.setConfirmedAt(LocalDateTime.now());
            case SHIPPING -> order.setShippedAt(LocalDateTime.now());
            case DELIVERED -> order.setDeliveredAt(LocalDateTime.now());
            case CANCELED -> order.setCancelledAt(LocalDateTime.now());
        }
        
        order = orderRepository.save(order);

        // Send notification with specific message based on status
        String notificationMessage = getStatusUpdateMessage(order, newStatus);
        sendOrderNotification(order, notificationMessage);

        // Handle post-delivery actions
        if (newStatus == OrderStatus.DELIVERED) {
            handleDeliveryCompletion(order);
        }

        log.info("Order status updated: orderId={}, oldStatus={}, newStatus={}",
                orderId, oldStatus, newStatus);

        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse confirmOrder(String orderId) {
        log.info("Confirming order: orderId={}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể xác nhận đơn hàng ở trạng thái PENDING");
        }

        order.setStatus(OrderStatus.CONFIRMED);
        order.setConfirmedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        sendOrderNotification(order,
                String.format("Đơn hàng #%s của bạn đã được xác nhận bởi cửa hàng %s",
                        order.getOrderCode(), order.getStore().getStoreName()));

        log.info("Order confirmed successfully: orderId={}", orderId);
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse startPreparing(String orderId) {
        log.info("Starting order preparation: orderId={}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể chuẩn bị đơn hàng ở trạng thái CONFIRMED");
        }

        order.setStatus(OrderStatus.PREPARING);
        order = orderRepository.save(order);

        sendOrderNotification(order,
                String.format("Cửa hàng %s đang chuẩn bị đơn hàng #%s của bạn",
                        order.getStore().getStoreName(), order.getOrderCode()));

        log.info("Order preparation started: orderId={}", orderId);
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse startShipping(String orderId, String trackingNumber) {
        log.info("Starting order shipment: orderId={}, trackingNumber={}", orderId, trackingNumber);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.PREPARING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể giao hàng từ trạng thái PREPARING");
        }

        // Create shipment record with fixed shipping provider
        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setTrackingNumber(trackingNumber);
        shipment.setShippingProvider("Giao Hàng Nhanh"); // Fixed provider name
        shipment.setStatus(ShipmentStatus.SHIPPING);
        shipment.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(3)); // Default 3 days
        shipmentRepository.save(shipment);

        order.setStatus(OrderStatus.SHIPPING);
        order.setShippedAt(LocalDateTime.now());
        order.setShipment(shipment);
        order = orderRepository.save(order);

        sendOrderNotification(order,
                String.format("Đơn hàng #%s đang được giao đến bạn. Mã vận đơn: %s - Giao Hàng Nhanh",
                        order.getOrderCode(), trackingNumber));

        log.info("Order shipment started: orderId={}", orderId);
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse markAsDelivered(String orderId) {
        log.info("Marking order as delivered: orderId={}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        Shipment shipment = order.getShipment();
        OrderResponse response = completeDelivery(order, shipment);

        log.info("Order marked as delivered: orderId={}", orderId);
        return response;
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(String customerId, String orderId, CancelOrderRequest request) {
        log.info("Canceling order: customerId={}, orderId={}, reason={}",
                customerId, orderId, request.getReason());

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        // Verify ownership (customer or supplier can cancel)
        boolean isCustomer = order.getCustomer().getUserId().equals(customerId);

        // Validate cancellation based on order status
        if (order.getStatus() == OrderStatus.DELIVERED ||
            order.getStatus() == OrderStatus.CANCELED ||
            order.getStatus() == OrderStatus.RETURNED) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Không thể hủy đơn hàng ở trạng thái hiện tại");
        }

        // CRITICAL FIX: This check ensures that customers cannot bypass the cancel request workflow.
        // Only PENDING or CONFIRMED orders can be canceled directly by anyone.
        // Suppliers can cancel at any stage up to SHIPPING, but customers cannot.
        if (isCustomer && order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Bạn chỉ có thể hủy trực tiếp đơn hàng ở trạng thái 'Chờ xác nhận' hoặc 'Đã xác nhận'. " +
                    "Đối với các trạng thái khác, vui lòng tạo 'Yêu cầu hủy đơn'.");
        }

        // Suppliers can cancel up to the PREPARING stage. SHIPPING is handled by cancel request.
        if (!isCustomer && order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.PREPARING) {
             throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Nhà cung cấp chỉ có thể hủy trực tiếp đơn hàng ở trạng thái 'Chờ xác nhận', 'Đã xác nhận', hoặc 'Đang chuẩn bị'.");
        }

        // Return inventory
        for (OrderDetail detail : order.getOrderDetails()) {
            StoreProduct storeProduct = detail.getStoreProduct();
            storeProduct.setStockQuantity(storeProduct.getStockQuantity() + detail.getQuantity());
            storeProductRepository.save(storeProduct);
        }

        // Process refund if payment was made
        if (order.getPayment() != null &&
            order.getPayment().getStatus() == PaymentStatus.SUCCESS &&
            order.getPayment().getMethod() != PaymentMethod.COD) {
            processRefund(orderId);
        }

        // Rollback promotions
        if (!order.getPromotionUsages().isEmpty()) {
            for (PromotionUsage usage : order.getPromotionUsages()) {
                // Decrement promotion usage count
                String promotionId = usage.getPromotion().getPromotionId();
                int decremented = promotionRepository.decrementUsageCount(promotionId);
                if (decremented > 0) {
                    log.info("Decremented usage count for promotion: promotionId={}", promotionId);
                } else {
                    log.warn("Failed to decrement usage count for promotion (count may be 0): promotionId={}", promotionId);
                }
                
                // Delete usage record
                promotionUsageRepository.delete(usage);
            }
        }

        // Record customer violation if applicable
        if (isCustomer && request.getCustomerFault()) {
            automatedSuspensionService.recordOrderCancellation(customerId, orderId, request.getCustomerFault());
            log.info("Customer violation recorded for order cancellation: customerId={}, orderId={}", customerId, orderId);
        }

        order.setStatus(OrderStatus.CANCELED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancelReason(request.getReason());
        order = orderRepository.save(order);

        sendOrderNotification(order,
                String.format("Đơn hàng #%s đã bị hủy. Lý do: %s%s",
                        order.getOrderCode(),
                        request.getReason(),
                        (order.getPayment() != null && order.getPayment().getStatus() == PaymentStatus.REFUNDED)
                                ? ". Tiền đã được hoàn lại" : ""));

        log.info("Order canceled successfully: orderId={}", orderId);
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getCustomerOrders(String customerId, OrderStatus status, int page, int size) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orders = status != null
                ? orderRepository.findByCustomerAndStatus(customer, status, pageable)
                : orderRepository.findByCustomer(customer, pageable);

        return orders.map(this::mapToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getSupplierOrders(String supplierId, OrderStatus status, int page, int size) {
        log.info("Getting orders for supplier: supplierId={}, status={}", supplierId, status);

        // Get all supplier's stores
        List<Store> stores = storeRepository.findBySupplierUserId(supplierId);
        
        // If supplier has no stores, return empty page instead of throwing exception
        if (stores.isEmpty()) {
            log.warn("Supplier has no stores yet: supplierId={}", supplierId);
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            return Page.empty(pageable);
        }

        // Get storeIds
        List<String> storeIds = stores.stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orders;
        if (status != null) {
            orders = orderRepository.findByStoreStoreIdInAndStatus(storeIds, status, pageable);
        } else {
            orders = orderRepository.findByStoreStoreIdIn(storeIds, pageable);
        }

        return orders.map(this::mapToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getSupplierStoreOrders(String supplierId, String storeId, OrderStatus status, int page, int size) {
        log.info("Getting orders for supplier's specific store: supplierId={}, storeId={}, status={}", 
                supplierId, storeId, status);

        // Validate store ownership
        List<Store> stores = storeRepository.findBySupplierUserId(supplierId);
        boolean ownsStore = stores.stream()
                .anyMatch(store -> store.getStoreId().equals(storeId));

        if (!ownsStore) {
            throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Bạn không có quyền truy cập đơn hàng của cửa hàng này");
        }

        // Get orders for this specific store
        return getStoreOrders(storeId, status, page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getStoreOrders(String storeId, OrderStatus status, int page, int size) {
        log.info("Getting orders for store: storeId={}, status={}", storeId, status);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orders;
        if (status != null) {
            orders = orderRepository.findByStoreStoreIdAndStatus(storeId, status, pageable);
        } else {
            orders = orderRepository.findByStoreStoreId(storeId, pageable);
        }

        return orders.map(this::mapToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(OrderStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orders = status != null
                ? orderRepository.findByStatus(status, pageable)
                : orderRepository.findAll(pageable);

        return orders.map(this::mapToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> orders = orderRepository.findByCreatedAtBetween(startDate, endDate);
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderResponse processPaymentCallback(String orderId, String transactionId, boolean success) {
        log.info("Processing payment callback: orderId={}, transactionId={}, success={}",
                orderId, transactionId, success);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        Payment payment = order.getPayment();
        if (payment == null) {
            throw new NotFoundException(ErrorCode.PAYMENT_NOT_FOUND);
        }

        if (success) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionId(transactionId);
            order.setPaymentStatus(PaymentStatus.SUCCESS);
            order.setStatus(OrderStatus.CONFIRMED); // Auto-confirm on successful payment
            order.setConfirmedAt(LocalDateTime.now());

            sendOrderNotification(order,
                    String.format("Thanh toán đơn hàng #%s thành công (%s VNĐ). Đơn hàng đã được xác nhận và đang chờ cửa hàng chuẩn bị",
                            order.getOrderCode(), order.getTotalAmount()));

            // Notify supplier about confirmed paid order
            sendOrderNotificationToSupplier(order,
                    String.format("Đơn hàng #%s đã được thanh toán. Vui lòng chuẩn bị hàng",
                            order.getOrderCode()));
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            order.setPaymentStatus(PaymentStatus.FAILED);
            sendOrderNotification(order,
                    String.format("Thanh toán đơn hàng #%s thất bại. Vui lòng thử lại hoặc chọn phương thức thanh toán khác",
                            order.getOrderCode()));
        }

        paymentRepository.save(payment);
        order = orderRepository.save(order);

        log.info("Payment callback processed: orderId={}, paymentStatus={}",
                orderId, payment.getStatus());

        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public void processRefund(String orderId) {
        log.info("Processing refund: orderId={}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        Payment payment = order.getPayment();
        if (payment == null) {
            throw new NotFoundException(ErrorCode.PAYMENT_NOT_FOUND);
        }

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new BadRequestException(ErrorCode.INVALID_PAYMENT_STATUS,
                    "Chỉ có thể hoàn tiền cho đơn hàng đã thanh toán thành công");
        }

        // Process refund (integrate with payment gateway)
        // TODO: Implement actual refund logic with payment provider

        payment.setStatus(PaymentStatus.REFUNDED);
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
        orderRepository.save(order);

        // Deduct from supplier wallet (refund from pendingBalance since order not delivered yet)
        walletService.refundOrder(
                order.getStore().getSupplier().getUserId(),
                order,
                payment.getAmount(),
                true // isPending = true (order cancelled before delivery)
        );

        log.info("Refund processed successfully: orderId={}", orderId);
    }

    // Helper methods

    private void validateStatusTransition(OrderStatus from, OrderStatus to) {
        // Define valid transitions
        boolean valid = switch (from) {
            case PENDING -> to == OrderStatus.CONFIRMED || to == OrderStatus.CANCELED;
            case CONFIRMED -> to == OrderStatus.PREPARING || to == OrderStatus.CANCELED;
            case PREPARING -> to == OrderStatus.SHIPPING || to == OrderStatus.CANCELED;
            case SHIPPING -> to == OrderStatus.DELIVERED || to == OrderStatus.RETURNED;
            case DELIVERED -> to == OrderStatus.RETURNED;
            default -> false;
        };

        if (!valid) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    String.format("Không thể chuyển từ trạng thái %s sang %s", from, to));
        }
    }

    private void handleDeliveryCompletion(Order order) {
        log.info("Handling delivery completion: orderId={}", order.getOrderId());

        // Award bonus points (configurable % of order value)
        BigDecimal pointsToAward = order.getTotalAmount()
                .multiply(getPointsPercentage())
                .setScale(0, RoundingMode.HALF_UP);

        Customer customer = order.getCustomer();
        customer.setPoints(customer.getPoints() + pointsToAward.intValue());
        customer.setLifetimePoints(customer.getLifetimePoints() + pointsToAward.intValue());
        customerRepository.save(customer);

        log.info("Awarded {} points to customer: customerId={}", pointsToAward, customer.getUserId());

        // Create PointTransaction record for audit trail
        PointTransaction pointTransaction = new PointTransaction();
        pointTransaction.setCustomer(customer);
        pointTransaction.setTransactionType(PointTransactionType.EARN);
        pointTransaction.setPointsChange(pointsToAward.intValue());
        pointTransaction.setReason("Hoàn thành đơn hàng #" + order.getOrderCode() + 
                " - Tích " + getPointsPercentage().multiply(new BigDecimal("100")).intValue() + "% giá trị đơn hàng");
        pointTransactionRepository.save(pointTransaction);

        log.info("Created point transaction record: transactionId={}, points={}", 
                pointTransaction.getTransactionId(), pointsToAward);

        // Record supplier wallet pending balance (after commission deduction)
        walletService.addPendingBalance(
                order.getStore().getSupplier().getUserId(),
                order,
                order.getTotalAmount(),
                "Doanh thu đơn hàng " + order.getOrderCode()
        );

        // Update FavoriteStore metrics if store is favorited by customer
        updateFavoriteStoreMetrics(customer.getUserId(), order.getStore().getStoreId());

        log.info("Delivery completion handled successfully: orderId={}", order.getOrderId());
    }

    /**
     * Update FavoriteStore metrics when order is delivered
     * - Increment order count
     * - Update last order date
     * 
     * @param customerId Customer ID
     * @param storeId Store ID
     */
    private void updateFavoriteStoreMetrics(String customerId, String storeId) {
        try {
            favoriteStoreRepository.findByCustomerIdAndStoreId(customerId, storeId)
                    .ifPresent(favoriteStore -> {
                        favoriteStore.setOrderCount(favoriteStore.getOrderCount() + 1);
                        favoriteStore.setLastOrderDate(LocalDateTime.now());
                        favoriteStoreRepository.save(favoriteStore);
                        
                        log.info("Updated FavoriteStore metrics: customerId={}, storeId={}, orderCount={}", 
                                customerId, storeId, favoriteStore.getOrderCount());
                    });
        } catch (Exception e) {
            // Don't fail order completion if favorite store update fails
            log.error("Failed to update FavoriteStore metrics: customerId={}, storeId={}", 
                    customerId, storeId, e);
        }
    }

    private BigDecimal applyPromotions(Order order, List<String> promotionCodes) {
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal originalAmount = order.getTotalAmount();
        
        for (String code : promotionCodes) {
            Promotion promotion = promotionRepository.findByCodeWithLock(code)
                    .orElse(null);

            if (promotion == null) {
                log.warn("Promotion not found: code={}", code);
                continue;
            }

            // Validate promotion eligibility
            if (promotion.getStatus() != PromotionStatus.ACTIVE) {
                log.warn("Promotion not active: code={}", code);
                continue;
            }

            if (promotion.getMinimumOrderAmount() != null &&
                originalAmount.compareTo(promotion.getMinimumOrderAmount()) < 0) {
                log.warn("Order does not meet minimum amount: code={}, required={}, actual={}",
                        code, promotion.getMinimumOrderAmount(), originalAmount);
                continue;
            }

            // Check usage limits (while holding lock)
            if (promotion.getTotalUsageLimit() != null &&
                promotion.getCurrentUsageCount() >= promotion.getTotalUsageLimit()) {
                log.warn("Promotion usage limit reached: code={}", code);
                continue;
            }

            // CRITICAL FIX: Atomic increment with availability check
            // This combines check and increment in a single database operation
            // Returns 1 if successful, 0 if limit reached
            int updated = promotionRepository.incrementUsageCountIfAvailable(promotion.getPromotionId());

            if (updated == 0) {
                // Another transaction won the race and took the last slot
                log.warn("Promotion usage limit reached (race condition detected): code={}", code);
                continue;
            }

            // Calculate discount amount based on promotion type
            BigDecimal discountAmount = calculateDiscountAmount(promotion, originalAmount);
            totalDiscount = totalDiscount.add(discountAmount);

            // Create promotion usage record with order amount and discount
            PromotionUsage usage = new PromotionUsage();
            usage.setPromotion(promotion);
            usage.setCustomer(order.getCustomer());
            usage.setOrder(order);
            usage.setOrderAmount(originalAmount); // Original order amount before discount
            usage.setDiscountAmount(discountAmount); // Actual discount applied
            usage.setUsedAt(LocalDateTime.now());
            promotionUsageRepository.save(usage);

            order.getPromotionUsages().add(usage);

            log.info("Promotion applied successfully: code={}, orderId={}, discount={}, usageCount={}/{}",
                    code, order.getOrderId(), discountAmount,
                    promotion.getCurrentUsageCount() + 1,
                    promotion.getTotalUsageLimit());
        }
        
        // Update order total amount after applying all discounts
        if (totalDiscount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal finalAmount = originalAmount.subtract(totalDiscount);
            // Ensure final amount is not negative
            if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
                finalAmount = BigDecimal.ZERO;
            }
            order.setTotalAmount(finalAmount);
            orderRepository.save(order);
            
            log.info("Order total updated after promotions: orderId={}, original={}, discount={}, final={}",
                    order.getOrderId(), originalAmount, totalDiscount, finalAmount);
        }
        
        return totalDiscount;
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
        } else if (promotion.getType() == com.example.backend.entity.enums.PromotionType.FIXED_AMOUNT) {
            // Fixed amount discount
            discount = promotion.getDiscountValue();

            // Discount cannot exceed order amount
            if (discount.compareTo(orderAmount) > 0) {
                discount = orderAmount;
            }
        } else {
            // FREE_SHIPPING or other types - no monetary discount
            discount = BigDecimal.ZERO;
        }

        return discount;
    }

    private String generateOrderCode() {
        String code;
        do {
            code = "ORD" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        } while (orderRepository.existsByOrderCode(code));
        return code;
    }

    private void sendOrderNotification(Order order, String message) {
        try {
            // Customer notifications link to orders page (mobile app handles this)
            String linkUrl = null; // Mobile app will handle navigation

            // Send to customer
            inAppNotificationService.createNotificationForUser(
                    order.getCustomer().getUserId(),
                    NotificationType.ORDER_STATUS_UPDATE,
                    message,
                    linkUrl
            );

            log.info("Order notification sent: orderId={}, customerId={}, message={}",
                    order.getOrderId(), order.getCustomer().getUserId(), message);

        } catch (Exception e) {
            log.error("Failed to send order notification: orderId={}", order.getOrderId(), e);
            // Don't throw exception - notification failure shouldn't break order flow
        }
    }

    private void sendOrderNotificationToSupplier(Order order, String message) {
        try {
            // Link to supplier's order list page
            String linkUrl = "/orders/list";

            // Send to supplier
            inAppNotificationService.createNotificationForUser(
                    order.getStore().getSupplier().getUserId(),
                    NotificationType.NEW_ORDER,
                    message,
                    linkUrl
            );

            log.info("Order notification sent to supplier: orderId={}, supplierId={}, message={}",
                    order.getOrderId(), order.getStore().getSupplier().getUserId(), message);

        } catch (Exception e) {
            log.error("Failed to send order notification to supplier: orderId={}", order.getOrderId(), e);
            // Don't throw exception - notification failure shouldn't break order flow
        }
    }

    private String getStatusUpdateMessage(Order order, OrderStatus newStatus) {
        return switch (newStatus) {
            case PENDING -> String.format("Đơn hàng #%s đang chờ xác nhận", order.getOrderCode());
            case CONFIRMED -> String.format("Đơn hàng #%s đã được xác nhận bởi cửa hàng %s",
                    order.getOrderCode(), order.getStore().getStoreName());
            case PREPARING -> String.format("Cửa hàng %s đang chuẩn bị đơn hàng #%s của bạn",
                    order.getStore().getStoreName(), order.getOrderCode());
            case SHIPPING -> {
                String trackingInfo = (order.getShipment() != null && order.getShipment().getTrackingNumber() != null)
                        ? ". Mã vận đơn: " + order.getShipment().getTrackingNumber()
                        : "";
                yield String.format("Đơn hàng #%s đang được giao đến bạn%s",
                        order.getOrderCode(), trackingInfo);
            }
            case DELIVERED -> {
                BigDecimal pointsAwarded = order.getTotalAmount()
                        .multiply(getPointsPercentage())
                        .setScale(0, RoundingMode.HALF_UP);
                yield String.format("Đơn hàng #%s đã được giao thành công! Bạn nhận được %s điểm thưởng",
                        order.getOrderCode(), pointsAwarded);
            }
            case CANCELED -> String.format("Đơn hàng #%s đã bị hủy", order.getOrderCode());
            case RETURNED -> String.format("Đơn hàng #%s đã được trả lại", order.getOrderCode());
            default -> String.format("Trạng thái đơn hàng #%s đã được cập nhật", order.getOrderCode());
        };
    }

    private OrderResponse completeDelivery(Order order, Shipment shipment) {
        if (order.getStatus() != OrderStatus.SHIPPING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể hoàn thành đơn hàng từ trạng thái SHIPPING");
        }

        // Validate shipment status
        Shipment resolvedShipment = shipment != null ? shipment : order.getShipment();
        
        if (resolvedShipment != null) {
            if (resolvedShipment.getStatus() != ShipmentStatus.SHIPPING) {
                throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                        String.format("Không thể xác nhận giao hàng. Vận đơn đang ở trạng thái %s, cần ở trạng thái SHIPPING",
                                resolvedShipment.getStatus().getDisplayName()));
            }
            
            // Update shipment status
            resolvedShipment.setStatus(ShipmentStatus.DELIVERED);
            shipmentRepository.save(resolvedShipment);
            order.setShipment(resolvedShipment);
        }

        // Update order status
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        order.setActualDelivery(LocalDateTime.now());
        order.setBalanceReleased(false); // Will be released after 7-day hold period
        order = orderRepository.save(order);

        handleDeliveryCompletion(order);

        BigDecimal pointsAwarded = order.getTotalAmount()
                .multiply(getPointsPercentage())
                .setScale(0, RoundingMode.HALF_UP);

        sendOrderNotification(order,
                String.format("Đơn hàng #%s đã được giao thành công! Bạn nhận được %s điểm thưởng. Đánh giá sản phẩm để nhận thêm điểm",
                        order.getOrderCode(), pointsAwarded));

        return mapToOrderResponse(order);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getOrderDetails().stream()
                .map(this::mapToOrderItemResponse)
                .collect(Collectors.toList());

        List<String> appliedPromotions = order.getPromotionUsages().stream()
                .map(usage -> usage.getPromotion().getCode())
                .collect(Collectors.toList());

        // Build shipping address object
        OrderResponse.OrderAddressResponse shippingAddressResponse = OrderResponse.OrderAddressResponse.builder()
                .recipientName(order.getCustomer().getFullName())
                .phoneNumber(order.getCustomer().getPhoneNumber())
                .addressLine(order.getShippingAddress())
                .ward(null) // TODO: Extract from shippingAddress if available
                .district(null)
                .city(null)
                .fullAddress(order.getShippingAddress())
                .build();

        return OrderResponse.builder()
                .id(order.getOrderId())
                .orderId(order.getOrderId()) // Deprecated
                .orderCode(order.getOrderCode())
                // Customer info
                .customerId(order.getCustomer().getUserId())
                .customerName(order.getCustomer().getFullName())
                .customerPhone(order.getCustomer().getPhoneNumber())
                .customerEmail(order.getCustomer().getEmail())
                // Store/Supplier info
                .storeId(order.getStore().getStoreId())
                .storeName(order.getStore().getStoreName())
                .supplierId(order.getStore().getSupplier().getUserId())
                .supplierName(order.getStore().getSupplier().getFullName())
                // Items
                .items(items)
                // Status
                .status(order.getStatus().name())
                .statusHistory(null) // TODO: Implement if OrderStatusHistory entity exists
                // Pricing
                .subtotal(order.getTotalAmount().subtract(order.getShippingFee()).add(order.getDiscount()))
                .shippingFee(order.getShippingFee())
                .discount(order.getDiscount())
                .totalAmount(order.getTotalAmount())
                // Payment
                .paymentMethod(order.getPayment() != null ? order.getPayment().getMethod().name() : null)
                .paymentStatus(order.getPaymentStatus().name())
                // Shipping
                .shippingAddress(shippingAddressResponse)
                .trackingNumber(order.getShipment() != null ? order.getShipment().getTrackingNumber() : null)
                .shipmentStatus(order.getShipment() != null ? order.getShipment().getStatus().name() : null)
                // Notes
                .note(order.getNote())
                .cancelReason(order.getCancelReason())
                // Dates
                .estimatedDeliveryDate(order.getEstimatedDelivery() != null ? order.getEstimatedDelivery().toString() : null)
                .actualDeliveryDate(order.getActualDelivery() != null ? order.getActualDelivery().toString() : null)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .confirmedAt(order.getConfirmedAt())
                .shippedAt(order.getShippedAt())
                .deliveredAt(order.getDeliveredAt())
                .cancelledAt(order.getCancelledAt())
                // Legacy
                .appliedPromotions(appliedPromotions)
                .build();
    }

    private OrderResponse.OrderItemResponse mapToOrderItemResponse(OrderDetail detail) {
        StoreProduct storeProduct = detail.getStoreProduct();
        ProductVariant variant = storeProduct.getVariant();
        Product product = variant.getProduct();

        String imageUrl = product.getImages().isEmpty()
                ? null
                : product.getImages().get(0).getImageUrl();

        BigDecimal price = detail.getAmount().divide(
                BigDecimal.valueOf(detail.getQuantity()),
                2,
                RoundingMode.HALF_UP
        );

        return OrderResponse.OrderItemResponse.builder()
                .id(detail.getOrderDetailId())
                .orderDetailId(detail.getOrderDetailId()) // Deprecated
                .productId(product.getProductId())
                .productName(product.getName())
                .variantId(variant.getVariantId())
                .variantName(variant.getSku())
                .imageUrl(imageUrl)
                .productImage(imageUrl) // Deprecated
                .quantity(detail.getQuantity())
                .price(price)
                .unitPrice(price) // Deprecated
                .subtotal(detail.getAmount())
                .amount(detail.getAmount()) // Deprecated
                .canReview(detail.getOrder().getStatus() == OrderStatus.DELIVERED)
                .hasReviewed(detail.getReview() != null)
                .build();
    }
}
