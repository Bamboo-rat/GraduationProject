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
import com.example.backend.service.NotificationService;
import com.example.backend.service.OrderService;
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
    private final PaymentRepository paymentRepository;
    private final ShipmentRepository shipmentRepository;
    private final StoreProductRepository storeProductRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final PromotionRepository promotionRepository;
    private final NotificationService notificationService;
    private final AutomatedSuspensionService automatedSuspensionService;
    private final WalletService walletService;

    // TODO: Inject PointTransactionRepository when needed
    // private final PointTransactionRepository pointTransactionRepository;

    private static final BigDecimal POINTS_PERCENTAGE = new BigDecimal("0.05"); // 5% points

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

        // Validate inventory and prices
        List<CartDetail> itemsToRemove = new ArrayList<>();
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
            if (product.getExpiryDate() != null && product.getExpiryDate().isBefore(LocalDateTime.now())) {
                itemsToRemove.add(detail);
                continue;
            }

            // Check stock
            if (storeProduct.getStockQuantity() < detail.getQuantity()) {
                throw new BadRequestException(ErrorCode.INSUFFICIENT_STOCK,
                        String.format("Sản phẩm '%s' không đủ số lượng. Còn lại: %d",
                                product.getName(), storeProduct.getStockQuantity()));
            }
        }

        if (!itemsToRemove.isEmpty()) {
            throw new BadRequestException(ErrorCode.CART_HAS_INVALID_ITEMS,
                    "Giỏ hàng có sản phẩm không hợp lệ. Vui lòng kiểm tra lại");
        }

        // Create order
        Order order = new Order();
        order.setOrderCode(generateOrderCode());
        order.setCustomer(cart.getCustomer());
        order.setStore(cart.getStore());
        order.setTotalAmount(cart.getTotal());
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setShippingAddress(request.getShippingAddress());
        order = orderRepository.save(order);

        // Copy cart details to order details
        for (CartDetail cartDetail : cart.getCartDetails()) {
            OrderDetail orderDetail = new OrderDetail();
            orderDetail.setOrder(order);
            orderDetail.setStoreProduct(cartDetail.getStoreProduct());
            orderDetail.setQuantity(cartDetail.getQuantity());
            orderDetail.setAmount(cartDetail.getAmount());
            order.getOrderDetails().add(orderDetail);
            orderDetailRepository.save(orderDetail);

            // Deduct stock
            StoreProduct storeProduct = cartDetail.getStoreProduct();
            storeProduct.setStockQuantity(storeProduct.getStockQuantity() - cartDetail.getQuantity());
            storeProductRepository.save(storeProduct);
        }

        // Apply promotions if provided
        if (request.getPromotionCodes() != null && !request.getPromotionCodes().isEmpty()) {
            applyPromotions(order, request.getPromotionCodes());
        }

        // Create payment record
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setMethod(request.getPaymentMethod());
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(PaymentStatus.PENDING);

        if (request.getPaymentMethod() == PaymentMethod.E_WALLET) {
            payment.setProvider(PaymentProvider.VNPAY); // Default to VNPay
        } else if (request.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
            payment.setProvider(PaymentProvider.BANK_TRANSFER);
        }

        paymentRepository.save(payment);
        order.setPayment(payment);

        // Clear cart after successful checkout
        cartRepository.delete(cart);

        log.info("Checkout completed successfully: orderId={}, orderCode={}",
                order.getOrderId(), order.getOrderCode());

        // Send notification
        sendOrderNotification(order, "Đơn hàng của bạn đã được tạo thành công");

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
        order = orderRepository.save(order);

        // Send notification
        sendOrderNotification(order, "Trạng thái đơn hàng đã được cập nhật");

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
        order = orderRepository.save(order);

        sendOrderNotification(order, "Đơn hàng của bạn đã được xác nhận");

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

        sendOrderNotification(order, "Cửa hàng đang chuẩn bị đơn hàng của bạn");

        log.info("Order preparation started: orderId={}", orderId);
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse startShipping(String orderId, String trackingNumber, String shippingProvider) {
        log.info("Starting order shipment: orderId={}, trackingNumber={}", orderId, trackingNumber);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.PREPARING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể giao hàng từ trạng thái PREPARING");
        }

        // Create shipment record
        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setTrackingNumber(trackingNumber);
        shipment.setShippingProvider(shippingProvider);
        shipment.setStatus(ShipmentStatus.IN_TRANSIT);
        shipment.setEstimatedDeliveryDate(LocalDateTime.now().plusDays(3)); // Default 3 days
        shipmentRepository.save(shipment);

        order.setStatus(OrderStatus.SHIPPING);
        order.setShipment(shipment);
        order = orderRepository.save(order);

        sendOrderNotification(order, "Đơn hàng của bạn đang được giao. Mã vận đơn: " + trackingNumber);

        log.info("Order shipment started: orderId={}", orderId);
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse markAsDelivered(String orderId) {
        log.info("Marking order as delivered: orderId={}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.SHIPPING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể hoàn thành đơn hàng từ trạng thái SHIPPING");
        }

        order.setStatus(OrderStatus.DELIVERED);
        order = orderRepository.save(order);

        // Update shipment status
        if (order.getShipment() != null) {
            Shipment shipment = order.getShipment();
            shipment.setStatus(ShipmentStatus.DELIVERED);
            shipmentRepository.save(shipment);
        }

        // Handle delivery completion (points, wallet, etc.)
        handleDeliveryCompletion(order);

        sendOrderNotification(order, "Đơn hàng của bạn đã được giao thành công");

        log.info("Order marked as delivered: orderId={}", orderId);
        return mapToOrderResponse(order);
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

        // From PREPARING onwards, require approval process (for now we'll allow but log warning)
        if (order.getStatus() == OrderStatus.PREPARING ||
            order.getStatus() == OrderStatus.SHIPPING) {
            log.warn("Canceling order in {} status requires approval process", order.getStatus());
            // TODO: Implement cancellation request approval workflow
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
                promotionUsageRepository.delete(usage);
            }
        }

        // Record customer violation if applicable
        if (isCustomer && request.getCustomerFault()) {
            automatedSuspensionService.recordOrderCancellation(customerId);
            log.info("Customer violation recorded for order cancellation: customerId={}", customerId);
        }

        order.setStatus(OrderStatus.CANCELED);
        order = orderRepository.save(order);

        sendOrderNotification(order, "Đơn hàng của bạn đã bị hủy. Lý do: " + request.getReason());

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
    public Page<OrderResponse> getStoreOrders(String storeId, OrderStatus status, int page, int size) {
        Store store = new Store();
        store.setStoreId(storeId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orders = status != null
                ? orderRepository.findByStoreAndStatus(store, status, pageable)
                : orderRepository.findByStore(store, pageable);

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

            sendOrderNotification(order, "Thanh toán thành công. Đơn hàng đã được xác nhận");
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            sendOrderNotification(order, "Thanh toán thất bại. Vui lòng thử lại");
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

        // Record wallet transaction
        walletService.recordTransaction(
                order.getStore().getSupplier().getSupplierId(),
                TransactionType.ORDER_REFUND,
                payment.getAmount().negate(),
                "Hoàn tiền đơn hàng " + order.getOrderCode()
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

        // Award bonus points (5% of order value)
        BigDecimal pointsToAward = order.getTotalAmount()
                .multiply(POINTS_PERCENTAGE)
                .setScale(0, RoundingMode.HALF_UP);

        Customer customer = order.getCustomer();
        customer.setPoints(customer.getPoints() + pointsToAward.intValue());
        customer.setLifetimePoints(customer.getLifetimePoints() + pointsToAward.intValue());
        customerRepository.save(customer);

        log.info("Awarded {} points to customer: customerId={}", pointsToAward, customer.getUserId());

        // TODO: Create PointTransaction record
        // PointTransaction pointTransaction = new PointTransaction();
        // pointTransaction.setCustomer(customer);
        // pointTransaction.setType(PointTransactionType.ORDER_COMPLETION);
        // pointTransaction.setPoints(pointsToAward.intValue());
        // pointTransaction.setDescription("Hoàn thành đơn hàng " + order.getOrderCode());
        // pointTransactionRepository.save(pointTransaction);

        // Record supplier wallet pending balance
        walletService.recordTransaction(
                order.getStore().getSupplier().getSupplierId(),
                TransactionType.ORDER_REVENUE,
                order.getTotalAmount(),
                "Doanh thu đơn hàng " + order.getOrderCode()
        );

        log.info("Delivery completion handled successfully: orderId={}", order.getOrderId());
    }

    private void applyPromotions(Order order, List<String> promotionCodes) {
        for (String code : promotionCodes) {
            Promotion promotion = promotionRepository.findByPromotionCode(code)
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
                order.getTotalAmount().compareTo(promotion.getMinimumOrderAmount()) < 0) {
                log.warn("Order does not meet minimum amount: code={}, required={}, actual={}",
                        code, promotion.getMinimumOrderAmount(), order.getTotalAmount());
                continue;
            }

            // Check usage limits
            long usageCount = promotionUsageRepository.countByPromotion(promotion);
            if (promotion.getMaxUsageCount() != null && usageCount >= promotion.getMaxUsageCount()) {
                log.warn("Promotion usage limit reached: code={}", code);
                continue;
            }

            // Create promotion usage record
            PromotionUsage usage = new PromotionUsage();
            usage.setPromotion(promotion);
            usage.setCustomer(order.getCustomer());
            usage.setOrder(order);
            usage.setUsedAt(LocalDateTime.now());
            promotionUsageRepository.save(usage);

            order.getPromotionUsages().add(usage);

            log.info("Promotion applied: code={}, orderId={}", code, order.getOrderId());
        }
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
            // TODO: Implement actual notification sending
            log.info("Sending order notification: orderId={}, message={}", order.getOrderId(), message);
            // notificationService.sendOrderNotification(order.getCustomer().getUserId(), message);
        } catch (Exception e) {
            log.error("Failed to send order notification", e);
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getOrderDetails().stream()
                .map(this::mapToOrderItemResponse)
                .collect(Collectors.toList());

        List<String> appliedPromotions = order.getPromotionUsages().stream()
                .map(usage -> usage.getPromotion().getPromotionCode())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .customerId(order.getCustomer().getUserId())
                .customerName(order.getCustomer().getFullName())
                .storeId(order.getStore().getStoreId())
                .storeName(order.getStore().getStoreName())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .paymentStatus(order.getPaymentStatus().name())
                .paymentMethod(order.getPayment() != null ? order.getPayment().getMethod().name() : null)
                .shippingAddress(order.getShippingAddress())
                .trackingNumber(order.getShipment() != null ? order.getShipment().getTrackingNumber() : null)
                .shipmentStatus(order.getShipment() != null ? order.getShipment().getStatus().name() : null)
                .items(items)
                .appliedPromotions(appliedPromotions)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderResponse.OrderItemResponse mapToOrderItemResponse(OrderDetail detail) {
        StoreProduct storeProduct = detail.getStoreProduct();
        ProductVariant variant = storeProduct.getVariant();
        Product product = variant.getProduct();

        String productImage = product.getProductImages().isEmpty()
                ? null
                : product.getProductImages().get(0).getImageUrl();

        BigDecimal unitPrice = detail.getAmount().divide(
                BigDecimal.valueOf(detail.getQuantity()),
                2,
                RoundingMode.HALF_UP
        );

        return OrderResponse.OrderItemResponse.builder()
                .orderDetailId(detail.getOrderDetailId())
                .productName(product.getName())
                .variantName(variant.getSku())
                .productImage(productImage)
                .quantity(detail.getQuantity())
                .unitPrice(unitPrice)
                .amount(detail.getAmount())
                .canReview(detail.getOrder().getStatus() == OrderStatus.DELIVERED)
                .hasReviewed(detail.getReview() != null)
                .build();
    }
}
