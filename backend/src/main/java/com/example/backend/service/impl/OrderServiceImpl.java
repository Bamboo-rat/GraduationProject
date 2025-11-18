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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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
    private final AddressRepository addressRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    private static final String CONFIG_KEY_POINTS_PERCENTAGE = "points.percentage.per.order";
    private static final BigDecimal DEFAULT_POINTS_PERCENTAGE = new BigDecimal("0.05"); // 5% default
    
    // Minimum order value after discount (10,000 VND)
    private static final BigDecimal MIN_ORDER_VALUE = new BigDecimal("10000");

    /**
     * Get points reward percentage from system config
     * 
     * @return BigDecimal percentage (e.g., 0.05 for 5%)
     */
    private BigDecimal getPointsPercentage() {
        return systemConfigService.getConfigValueAsDecimal(
                CONFIG_KEY_POINTS_PERCENTAGE,
                DEFAULT_POINTS_PERCENTAGE);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public OrderResponse checkout(String customerId, CheckoutRequest request) {
        // Generate idempotency key if not provided by frontend
        if (request.getIdempotencyKey() == null || request.getIdempotencyKey().trim().isEmpty()) {
            String generatedKey = java.util.UUID.randomUUID().toString();
            request.setIdempotencyKey(generatedKey);
            log.warn("Frontend did not provide idempotency key. Auto-generated: {}", generatedKey);
        }

        log.info("Processing checkout: customerId={}, cartId={}, idempotencyKey={}", 
                customerId, request.getCartId(), request.getIdempotencyKey());

        // IDEMPOTENCY CHECK: Check if order with this idempotency key already exists
        Optional<Order> existingOrder = orderRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (existingOrder.isPresent()) {
            Order order = existingOrder.get();
            log.warn("Duplicate checkout request detected. Returning existing order: orderId={}, idempotencyKey={}", 
                    order.getOrderId(), request.getIdempotencyKey());
            
            // Verify that the existing order belongs to the same customer
            if (!order.getCustomer().getUserId().equals(customerId)) {
                throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                        "Idempotency key đã được sử dụng bởi khách hàng khác");
            }

            // Use optimized query to prevent N+1 when mapping to response
            order = orderRepository.findByIdWithDetails(order.getOrderId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
            return mapToOrderResponse(order);
        }

        // Get cart
        Cart cart = cartRepository.findById(request.getCartId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.CART_NOT_FOUND));

        // Verify ownership
        if (!cart.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền truy cập giỏ hàng này");
        }

        // Get and validate shipping address
        Address shippingAddress = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.ADDRESS_NOT_FOUND));
        
        // Verify address belongs to customer
        if (!shippingAddress.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Địa chỉ này không thuộc về bạn");
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
            // Fetch storeProduct with pessimistic lock to avoid overselling in concurrent
            // checkouts
            StoreProduct storeProduct = storeProductRepository
                    .findByStoreProductIdForUpdate(detail.getStoreProduct().getStoreProductId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.PRODUCT_NOT_FOUND));
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

        // Step 1: Calculate subtotal (before discount and shipping)
        BigDecimal subtotal = orderTotal;

        // Step 2: Apply promotions and calculate discount (with stacking validation)
        BigDecimal totalDiscount = BigDecimal.ZERO;
        if (request.getPromotionCodes() != null && !request.getPromotionCodes().isEmpty()) {
            // Track remaining subtotal after each promotion
            BigDecimal remainingSubtotal = subtotal;
            
            for (String promotionCode : request.getPromotionCodes()) {
                Promotion promotion = promotionRepository.findByCode(promotionCode)
                        .orElseThrow(() -> new NotFoundException(ErrorCode.PROMOTION_NOT_FOUND));
                
                // IMPORTANT: Validate minimum order amount with REMAINING subtotal
                // This prevents stacking abuse where multiple promotions reduce below minimum
                if (promotion.getMinimumOrderAmount() != null &&
                        remainingSubtotal.compareTo(promotion.getMinimumOrderAmount()) < 0) {
                    throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                            String.format("Promotion '%s' yêu cầu giá trị đơn hàng tối thiểu %s VNĐ. " +
                                    "Giá trị hiện tại sau các promotion trước: %s VNĐ",
                                    promotion.getCode(), promotion.getMinimumOrderAmount(), remainingSubtotal));
                }
                
                // Calculate discount amount based on REMAINING subtotal
                BigDecimal discountAmount = calculatePromotionDiscount(promotion, remainingSubtotal);
                totalDiscount = totalDiscount.add(discountAmount);
                
                // Update remaining subtotal for next promotion
                remainingSubtotal = remainingSubtotal.subtract(discountAmount);
                
                log.debug("Promotion {} applied: discount={}, remainingSubtotal={}", 
                        promotionCode, discountAmount, remainingSubtotal);
            }
        }

        // Step 3: Get shipping fee (validate it's provided or calculate)
        BigDecimal shippingFee = request.getShippingFee() != null 
                ? request.getShippingFee() 
                : BigDecimal.ZERO;

        // Step 4: Validate discount does not exceed allowed maximum
        // Business rule: Discount cannot exceed (Subtotal - MIN_ORDER_VALUE)
        // This ensures order value after discount is at least MIN_ORDER_VALUE
        BigDecimal maxAllowedDiscount = subtotal.subtract(MIN_ORDER_VALUE);
        if (maxAllowedDiscount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    String.format("Giá trị đơn hàng tối thiểu là %s VNĐ", MIN_ORDER_VALUE));
        }
        
        if (totalDiscount.compareTo(maxAllowedDiscount) > 0) {
            log.warn("Discount {} exceeds maximum allowed {}. Capping discount.", totalDiscount, maxAllowedDiscount);
            totalDiscount = maxAllowedDiscount;
        }

        // Step 5: Calculate final total ONCE
        // Formula: Final Total = Subtotal - Discount + Shipping Fee
        BigDecimal finalTotal = subtotal
                .subtract(totalDiscount)
                .add(shippingFee);

        // Sanity check: Final total should never be less than MIN_ORDER_VALUE + shipping
        BigDecimal minFinalTotal = MIN_ORDER_VALUE.add(shippingFee);
        if (finalTotal.compareTo(minFinalTotal) < 0) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    String.format("Tổng đơn hàng sau giảm giá phải tối thiểu %s VNĐ (chưa bao gồm phí ship)", 
                            MIN_ORDER_VALUE));
        }

        // Format shipping address string from Address entity
        String formattedAddress = String.format("%s - %s\n%s, %s, %s, %s",
                shippingAddress.getFullName(),
                shippingAddress.getPhoneNumber(),
                shippingAddress.getStreet(),
                shippingAddress.getWard(),
                shippingAddress.getDistrict(),
                shippingAddress.getProvince());

        // Create order with all calculated values
        Order order = new Order();
        order.setOrderCode(generateOrderCode());
        order.setIdempotencyKey(request.getIdempotencyKey());
        order.setCustomer(cart.getCustomer());
        order.setStore(cart.getStore());
        order.setTotalAmount(finalTotal);  // Set ONCE with final calculated value
        order.setShippingFee(shippingFee);
        order.setDiscount(totalDiscount);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setShippingAddress(formattedAddress);
        order.setNote(request.getNote());
        order = orderRepository.save(order);

        log.info("Order financial breakdown - Subtotal: {}, Discount: {}, Shipping: {}, Final Total: {}",
                subtotal, totalDiscount, shippingFee, finalTotal);

        // Copy cart details to order details with current prices
        for (CartDetail cartDetail : cart.getCartDetails()) {
            // Validate quantity to prevent division by zero and invalid orders
            if (cartDetail.getQuantity() <= 0) {
                throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Quantity must be greater than 0 for product: " +
                    cartDetail.getStoreProduct().getVariant().getProduct().getName());
            }

            // Re-fetch with lock before deducting stock to ensure atomicity
            StoreProduct storeProduct = storeProductRepository
                    .findByStoreProductIdForUpdate(cartDetail.getStoreProduct().getStoreProductId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.PRODUCT_NOT_FOUND));
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
            orderDetail.setAmount(itemAmount);
            order.getOrderDetails().add(orderDetail);
            orderDetailRepository.save(orderDetail);

            // Deduct stock
            storeProduct.setStockQuantity(storeProduct.getStockQuantity() - cartDetail.getQuantity());
            storeProductRepository.save(storeProduct);
        }

        // Now actually apply promotions (record usage)
        if (request.getPromotionCodes() != null && !request.getPromotionCodes().isEmpty()) {
            applyPromotionsToOrder(order, request.getPromotionCodes());
        }

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

        // Reload with optimized query to prevent N+1 when mapping to response
        order = orderRepository.findByIdWithDetails(order.getOrderId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
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

        if (newStatus == OrderStatus.RETURNED) {
            handleOrderReturn(order);
        }

        log.info("Order status updated: orderId={}, oldStatus={}, newStatus={}",
                orderId, oldStatus, newStatus);

        // Reload with optimized query to prevent N+1 when mapping to response
        order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
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

        // Reload with optimized query to prevent N+1 when mapping to response
        order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
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

        // Reload with optimized query to prevent N+1 when mapping to response
        order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse startShipping(String orderId) {
        log.info("Starting order shipment: orderId={}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.PREPARING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể giao hàng từ trạng thái PREPARING");
        }

        // Generate unique tracking number
        String trackingNumber = generateTrackingNumber(order);
        
        
        int deliveryMinutes = 20 + (int) (Math.random() * 11); 
        LocalDateTime estimatedDelivery = LocalDateTime.now().plusMinutes(deliveryMinutes);
        
        // Create shipment record with fixed shipping provider
        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setTrackingNumber(trackingNumber);
        shipment.setShippingProvider("Giao Hàng Nhanh"); // Fixed provider name
        shipment.setStatus(ShipmentStatus.SHIPPING);
        shipment.setEstimatedDeliveryDate(estimatedDelivery);
        shipmentRepository.save(shipment);

        order.setStatus(OrderStatus.SHIPPING);
        order.setShippedAt(LocalDateTime.now());
        order.setEstimatedDelivery(estimatedDelivery); // Set estimated delivery on order
        order.setShipment(shipment);
        order = orderRepository.save(order);

        // Format estimated delivery time for notification
        String estimatedTimeStr = estimatedDelivery.format(DateTimeFormatter.ofPattern("HH:mm"));
        sendOrderNotification(order,
                String.format("Đơn hàng #%s đang được giao đến bạn. Mã vận đơn: %s - Giao Hàng Nhanh. Dự kiến giao lúc %s (%d phút)",
                        order.getOrderCode(), trackingNumber, estimatedTimeStr, deliveryMinutes));

        log.info("Order shipment started: orderId={}, trackingNumber={}, estimatedDelivery={}",
                orderId, trackingNumber, estimatedDelivery);

        // Reload with optimized query to prevent N+1 when mapping to response
        order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }
    
    /**
     * Generate unique tracking number for shipment
     * Format: GHN-YYYYMMDD-ORDERCODE-XXXX
     * Example: GHN-20251108-ORD1234-A5B2
     */
    private String generateTrackingNumber(Order order) {
        String datePrefix = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String orderCode = order.getOrderCode().replace("#", "");
        String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        
        return String.format("GHN-%s-%s-%s", datePrefix, orderCode, randomSuffix);
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

        // CRITICAL FIX: This check ensures that customers cannot bypass the cancel
        // request workflow.
        // Only PENDING or CONFIRMED orders can be canceled directly by anyone.
        // Suppliers can cancel at any stage up to SHIPPING, but customers cannot.
        if (isCustomer && order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Bạn chỉ có thể hủy trực tiếp đơn hàng ở trạng thái 'Chờ xác nhận' hoặc 'Đã xác nhận'. " +
                            "Đối với các trạng thái khác, vui lòng tạo 'Yêu cầu hủy đơn'.");
        }

        // Suppliers can cancel up to the PREPARING stage. SHIPPING is handled by cancel
        // request.
        if (!isCustomer && order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED
                && order.getStatus() != OrderStatus.PREPARING) {
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


        if (order.getStatus() == OrderStatus.DELIVERED || 
            (order.getStatus() == OrderStatus.SHIPPING && order.isBalanceReleased())) {
            
            log.info("Cancelling delivered order, refunding supplier wallet: orderId={}", orderId);
            
            String supplierId = order.getStore().getSupplier().getUserId();
            BigDecimal orderAmount = order.getTotalAmount();
            
            // Determine if balance is still pending or already released
            boolean isPending = !order.isBalanceReleased();
            
            // Refund will subtract from supplier wallet AND record commission refund for platform
            walletService.refundOrder(supplierId, order, orderAmount, isPending);
            
            log.info("Supplier wallet refunded: supplierId={}, amount={}, isPending={}", 
                    supplierId, orderAmount, isPending);
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
                    log.warn("Failed to decrement usage count for promotion (count may be 0): promotionId={}",
                            promotionId);
                }

                // Delete usage record
                promotionUsageRepository.delete(usage);
            }
        }

        // Record customer violation if applicable
        if (isCustomer && request.getCustomerFault()) {
            automatedSuspensionService.recordOrderCancellation(customerId, orderId, request.getCustomerFault());
            log.info("Customer violation recorded for order cancellation: customerId={}, orderId={}", customerId,
                    orderId);
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
                                ? ". Tiền đã được hoàn lại"
                                : ""));

        log.info("Order canceled successfully: orderId={}", orderId);

        // Reload with optimized query to prevent N+1 when mapping to response
        order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(String orderId) {
        // Use optimized query with JOIN FETCH to prevent N+1 query problem
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(String orderCode) {
        // Use optimized query with JOIN FETCH to prevent N+1 query problem
        Order order = orderRepository.findByOrderCodeWithDetails(orderCode)
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
                ? orderRepository.findByCustomerUserIdAndStatus(customerId, status, pageable)
                : orderRepository.findByCustomerUserId(customerId, pageable);

        return orders.map(this::mapToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getSupplierOrders(String supplierId, OrderStatus status, String searchTerm, 
                                                  String sortBy, String sortDir, int page, int size) {
        log.info("Getting orders for supplier: supplierId={}, status={}, search={}", supplierId, status, searchTerm);

        // Get all supplier's stores
        List<Store> stores = storeRepository.findBySupplierUserId(supplierId);

        // If supplier has no stores, return empty page instead of throwing exception
        if (stores.isEmpty()) {
            log.warn("Supplier has no stores yet: supplierId={}", supplierId);
            Pageable pageable = createPageable(page, size, sortBy, sortDir);
            return Page.empty(pageable);
        }

        // Get storeIds
        List<String> storeIds = stores.stream()
                .map(Store::getStoreId)
                .collect(Collectors.toList());

        Pageable pageable = createPageable(page, size, sortBy, sortDir);

        Page<Order> orders;
        String trimmedSearch = searchTerm != null ? searchTerm.trim() : "";
        boolean hasSearch = !trimmedSearch.isEmpty();
        
        if (hasSearch && status != null) {
            orders = orderRepository.searchStoreOrdersInByStatus(storeIds, status, trimmedSearch, pageable);
        } else if (hasSearch) {
            orders = orderRepository.searchStoreOrdersIn(storeIds, trimmedSearch, pageable);
        } else if (status != null) {
            orders = orderRepository.findByStoreStoreIdInAndStatus(storeIds, status, pageable);
        } else {
            orders = orderRepository.findByStoreStoreIdIn(storeIds, pageable);
        }

        return orders.map(this::mapToOrderResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getSupplierStoreOrders(String supplierId, String storeId, OrderStatus status, 
                                                       String searchTerm, String sortBy, String sortDir, 
                                                       int page, int size) {
        log.info("Getting orders for supplier's specific store: supplierId={}, storeId={}, status={}, search={}",
                supplierId, storeId, status, searchTerm);

        // Validate store ownership
        List<Store> stores = storeRepository.findBySupplierUserId(supplierId);
        boolean ownsStore = stores.stream()
                .anyMatch(store -> store.getStoreId().equals(storeId));

        if (!ownsStore) {
            throw new BadRequestException(ErrorCode.OPERATION_NOT_ALLOWED,
                    "Bạn không có quyền truy cập đơn hàng của cửa hàng này");
        }

        // Get orders for this specific store with search and sorting
        Pageable pageable = createPageable(page, size, sortBy, sortDir);
        
        Page<Order> orders;
        String trimmedSearch = searchTerm != null ? searchTerm.trim() : "";
        boolean hasSearch = !trimmedSearch.isEmpty();
        
        if (hasSearch && status != null) {
            orders = orderRepository.searchStoreOrdersByStatus(storeId, status, trimmedSearch, pageable);
        } else if (hasSearch) {
            orders = orderRepository.searchStoreOrders(storeId, trimmedSearch, pageable);
        } else if (status != null) {
            orders = orderRepository.findByStoreStoreIdAndStatus(storeId, status, pageable);
        } else {
            orders = orderRepository.findByStoreStoreId(storeId, pageable);
        }

        return orders.map(this::mapToOrderResponse);
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
                    String.format(
                            "Thanh toán đơn hàng #%s thành công (%s VNĐ). Đơn hàng đã được xác nhận và đang chờ cửa hàng chuẩn bị",
                            order.getOrderCode(), order.getTotalAmount()));

            // Notify supplier about confirmed paid order
            sendOrderNotificationToSupplier(order,
                    String.format("Đơn hàng #%s đã được thanh toán. Vui lòng chuẩn bị hàng",
                            order.getOrderCode()));
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            order.setPaymentStatus(PaymentStatus.FAILED);
            sendOrderNotification(order,
                    String.format(
                            "Thanh toán đơn hàng #%s thất bại. Vui lòng thử lại hoặc chọn phương thức thanh toán khác",
                            order.getOrderCode()));
        }

        paymentRepository.save(payment);
        order = orderRepository.save(order);

        log.info("Payment callback processed: orderId={}, paymentStatus={}",
                orderId, payment.getStatus());

        // Reload with optimized query to prevent N+1 when mapping to response
        order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
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

        // Deduct from supplier wallet (refund from pendingBalance since order not
        // delivered yet)
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
                "Doanh thu đơn hàng " + order.getOrderCode());

        // Update FavoriteStore metrics if store is favorited by customer
        updateFavoriteStoreMetrics(customer.getUserId(), order.getStore().getStoreId());

        log.info("Delivery completion handled successfully: orderId={}", order.getOrderId());
    }

    /**
     * Handle order return - refund supplier wallet
     * CRITICAL: When order is RETURNED, supplier must refund the money back to platform
     * 
     * @param order The returned order
     */
    private void handleOrderReturn(Order order) {
        log.info("Handling order return: orderId={}", order.getOrderId());

        String supplierId = order.getStore().getSupplier().getUserId();
        BigDecimal orderAmount = order.getTotalAmount();
        boolean isPending = !order.isBalanceReleased();

        // Refund will subtract from supplier wallet AND record commission refund for platform
        walletService.refundOrder(supplierId, order, orderAmount, isPending);

        log.info("Supplier wallet refunded for returned order: supplierId={}, orderId={}, amount={}, isPending={}", 
                supplierId, order.getOrderId(), orderAmount, isPending);

        // Return inventory back to store
        for (OrderDetail detail : order.getOrderDetails()) {
            StoreProduct storeProduct = detail.getStoreProduct();
            storeProduct.setStockQuantity(storeProduct.getStockQuantity() + detail.getQuantity());
            storeProductRepository.save(storeProduct);
            log.info("Returned inventory: productId={}, quantity={}, newStock={}",
                    storeProduct.getStoreProductId(), detail.getQuantity(), storeProduct.getStockQuantity());
        }

        // Refund customer payment if payment was successful
        if (order.getPayment() != null &&
                order.getPayment().getStatus() == PaymentStatus.SUCCESS &&
                order.getPayment().getMethod() != PaymentMethod.COD) {
            processRefund(order.getOrderId());
        }

        log.info("Order return handled successfully: orderId={}", order.getOrderId());
    }

    /**
     * Update FavoriteStore metrics when order is delivered
     * - Increment order count
     * - Update last order date
     * 
     * @param customerId Customer ID
     * @param storeId    Store ID
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



    /**
     * Calculate discount amount based on promotion type (for validation before order creation)
     */
    private BigDecimal calculatePromotionDiscount(Promotion promotion, BigDecimal subtotal) {
        BigDecimal discount;

        if (promotion.getType() == com.example.backend.entity.enums.PromotionType.PERCENTAGE) {
            // Percentage discount: subtotal * (discountValue / 100)
            discount = subtotal.multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);

            // Apply max discount limit if set
            if (promotion.getMaxDiscountAmount() != null &&
                    discount.compareTo(promotion.getMaxDiscountAmount()) > 0) {
                discount = promotion.getMaxDiscountAmount();
            }

            // Ensure discount does not exceed (subtotal - MIN_ORDER_VALUE)
            BigDecimal maxAllowedDiscount = subtotal.subtract(MIN_ORDER_VALUE);
            if (maxAllowedDiscount.compareTo(BigDecimal.ZERO) > 0 && 
                discount.compareTo(maxAllowedDiscount) > 0) {
                discount = maxAllowedDiscount;
            }
        } else if (promotion.getType() == com.example.backend.entity.enums.PromotionType.FIXED_AMOUNT) {
            // Fixed amount discount
            discount = promotion.getDiscountValue();

            // Discount cannot exceed (subtotal - MIN_ORDER_VALUE)
            // This ensures order value after discount is at least MIN_ORDER_VALUE
            BigDecimal maxAllowedDiscount = subtotal.subtract(MIN_ORDER_VALUE);
            if (maxAllowedDiscount.compareTo(BigDecimal.ZERO) > 0 && 
                discount.compareTo(maxAllowedDiscount) > 0) {
                discount = maxAllowedDiscount;
            }
        } else {
            // FREE_SHIPPING or other types - no monetary discount on subtotal
            discount = BigDecimal.ZERO;
        }

        return discount;
    }

    /**
     * Apply promotions to order and record usage (called after order is created)
     * IMPORTANT: Tracks remaining subtotal to validate stacked promotions correctly
     */
    private void applyPromotionsToOrder(Order order, List<String> promotionCodes) {
        BigDecimal subtotal = order.getTotalAmount()
                .add(order.getDiscount())
                .subtract(order.getShippingFee());
        
        // Track remaining subtotal after each promotion (for stacking validation)
        BigDecimal remainingSubtotal = subtotal;

        for (String code : promotionCodes) {
            Promotion promotion = promotionRepository.findByCodeWithLock(code)
                    .orElse(null);

            if (promotion == null) {
                log.warn("Promotion not found during application: code={}", code);
                continue;
            }
            
            // 1. Check promotion status
            if (promotion.getStatus() != PromotionStatus.ACTIVE) {
                log.warn("Promotion not active during checkout: code={}", code);
                continue;
            }

            // 2. Check date range (start/end dates)
            java.time.LocalDate today = java.time.LocalDate.now();
            if (promotion.getStartDate() != null && today.isBefore(promotion.getStartDate())) {
                log.warn("Promotion not yet started during checkout: code={}, startDate={}", 
                        code, promotion.getStartDate());
                continue;
            }
            if (promotion.getEndDate() != null && today.isAfter(promotion.getEndDate())) {
                log.warn("Promotion expired during checkout: code={}, endDate={}", 
                        code, promotion.getEndDate());
                continue;
            }

            // 3. Check customer tier eligibility
            if (!isCustomerEligibleForPromotionTier(order.getCustomer(), promotion)) {
                log.warn("Customer no longer eligible for promotion tier during checkout: customerId={}, tier={}, code={}", 
                        order.getCustomer().getUserId(), promotion.getTier(), code);
                continue;
            }

            // 4. Check minimum order amount with REMAINING subtotal (after previous promotions)
            if (promotion.getMinimumOrderAmount() != null &&
                    remainingSubtotal.compareTo(promotion.getMinimumOrderAmount()) < 0) {
                log.warn("Order does not meet minimum amount during checkout: code={}, required={}, remaining={}",
                        code, promotion.getMinimumOrderAmount(), remainingSubtotal);
                continue;
            }

            // 5. Check usage limits (while holding lock)
            if (promotion.getTotalUsageLimit() != null &&
                    promotion.getCurrentUsageCount() >= promotion.getTotalUsageLimit()) {
                log.warn("Promotion usage limit reached during application: code={}", code);
                continue;
            }

            // CRITICAL: Atomic increment with availability check
            int updated = promotionRepository.incrementUsageCountIfAvailable(promotion.getPromotionId());

            if (updated == 0) {
                log.warn("Promotion usage limit reached (race condition detected) during application: code={}", code);
                continue;
            }

            // Calculate discount amount based on REMAINING subtotal
            BigDecimal discountAmount = calculatePromotionDiscount(promotion, remainingSubtotal);

            // Create promotion usage record
            PromotionUsage usage = new PromotionUsage();
            usage.setPromotion(promotion);
            usage.setCustomer(order.getCustomer());
            usage.setOrder(order);
            usage.setOrderAmount(remainingSubtotal); // Record remaining subtotal before this promotion
            usage.setDiscountAmount(discountAmount);
            usage.setUsedAt(LocalDateTime.now());
            promotionUsageRepository.save(usage);

            order.getPromotionUsages().add(usage);
            
            // Update remaining subtotal for next promotion
            remainingSubtotal = remainingSubtotal.subtract(discountAmount);

            log.info("Promotion applied and recorded: code={}, orderId={}, discount={}, remainingSubtotal={}, usageCount={}/{}",
                    code, order.getOrderId(), discountAmount, remainingSubtotal,
                    promotion.getCurrentUsageCount() + 1,
                    promotion.getTotalUsageLimit());
        }
    }

    /**
     * Calculate discount amount based on promotion type (DEPRECATED - use calculatePromotionDiscount)
     * Kept for backward compatibility
     */
    @Deprecated
    private BigDecimal calculateDiscountAmount(Promotion promotion, BigDecimal orderAmount) {
        return calculatePromotionDiscount(promotion, orderAmount);
    }

    /**
     * Check if customer is eligible for promotion tier
     * This method validates tier-specific requirements like birthday month, first-time customer, etc.
     */
    private boolean isCustomerEligibleForPromotionTier(Customer customer, Promotion promotion) {
        PromotionTier promotionTier = promotion.getTier();
        CustomerTier customerTier = customer.getTier();

        return switch (promotionTier) {
            case GENERAL -> true; // All customers eligible
            case BRONZE_PLUS -> customerTier.ordinal() >= CustomerTier.BRONZE.ordinal(); // Bronze and above
            case SILVER_PLUS -> customerTier.ordinal() >= CustomerTier.SILVER.ordinal(); // Silver and above
            case GOLD_PLUS -> customerTier.ordinal() >= CustomerTier.GOLD.ordinal(); // Gold and above
            case PLATINUM_PLUS -> customerTier.ordinal() >= CustomerTier.PLATINUM.ordinal(); // Platinum and above
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
                    log.warn("Customer {} birthday is not in current month (applied: {}, checkout: {}), cannot use BIRTHDAY promotion",
                            customer.getUserId(), customer.getDateOfBirth().getMonth(), now.getMonth());
                }
                yield isBirthdayMonth;
            }
            case FIRST_TIME -> {
                // First-time promotion: check if customer has any previous completed orders
                // Count only DELIVERED orders to prevent abuse
                long completedOrderCount = orderRepository.countByCustomerAndStatus(customer, OrderStatus.DELIVERED);
                boolean isFirstTime = completedOrderCount == 0;
                if (!isFirstTime) {
                    log.warn("Customer {} has {} completed orders, cannot use FIRST_TIME promotion",
                            customer.getUserId(), completedOrderCount);
                }
                yield isFirstTime;
            }
        };
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
                    linkUrl);

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
                    linkUrl);

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
                        String.format(
                                "Không thể xác nhận giao hàng. Vận đơn đang ở trạng thái %s, cần ở trạng thái SHIPPING",
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
        
        if (order.getPayment() != null && order.getPayment().getMethod() == PaymentMethod.COD) {
            order.getPayment().setStatus(PaymentStatus.SUCCESS);
            order.setPaymentStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(order.getPayment());
            log.info("Updated COD payment status to SUCCESS: orderId={}, paymentId={}", 
                    order.getOrderId(), order.getPayment().getPaymentId());
        }
        
        order = orderRepository.save(order);

        handleDeliveryCompletion(order);

        BigDecimal pointsAwarded = order.getTotalAmount()
                .multiply(getPointsPercentage())
                .setScale(0, RoundingMode.HALF_UP);

        sendOrderNotification(order,
                String.format(
                        "Đơn hàng #%s đã được giao thành công! Bạn nhận được %s điểm thưởng. Đánh giá sản phẩm để nhận thêm điểm",
                        order.getOrderCode(), pointsAwarded));

        // Reload with optimized query to prevent N+1 when mapping to response
        order = orderRepository.findByIdWithDetails(order.getOrderId())
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
        return mapToOrderResponse(order);
    }

    /**
     * Helper method to create Pageable with dynamic sorting
     */
    private Pageable createPageable(int page, int size, String sortBy, String sortDir) {
        // Validate and sanitize sortBy field
        String validatedSortBy = validateSortField(sortBy);
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(direction, validatedSortBy));
    }

    /**
     * Validate and sanitize sort field to prevent injection
     */
    private String validateSortField(String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return "createdAt";
        }
        return switch (sortBy.toLowerCase()) {
            case "ordercode" -> "orderCode";
            case "createdat" -> "createdAt";
            case "updatedat" -> "updatedAt";
            case "totalamount" -> "totalAmount";
            case "status" -> "status";
            case "paymentmethod" -> "paymentMethod";
            default -> "createdAt"; // Default to createdAt
        };
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderDetail> orderDetails = order.getOrderDetails() != null
                ? order.getOrderDetails()
                : List.of();

        List<OrderResponse.OrderItemResponse> items = orderDetails.stream()
                .map(this::mapToOrderItemResponse)
                .collect(Collectors.toList());

        List<String> appliedPromotions = order.getPromotionUsages() != null
                ? order.getPromotionUsages().stream()
                        .map(usage -> usage.getPromotion() != null ? usage.getPromotion().getCode() : null)
                        .filter(code -> code != null && !code.isBlank())
                        .collect(Collectors.toList())
                : List.of();

        Customer customer = order.getCustomer();
        Store store = order.getStore();
        Supplier supplier = store != null ? store.getSupplier() : null;

        OrderStatus orderStatus = order.getStatus() != null ? order.getStatus() : OrderStatus.PENDING;
        PaymentStatus paymentStatus = order.getPaymentStatus() != null
                ? order.getPaymentStatus()
                : PaymentStatus.PENDING;

        BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal discount = order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO;
        BigDecimal subtotal = totalAmount.subtract(shippingFee).add(discount);

        // Build shipping address object - parse from formatted string
        // Format: "Nguyễn Văn A - 0901234567\n123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM"
        String[] addressParts = parseShippingAddress(order.getShippingAddress());
        
        OrderResponse.OrderAddressResponse shippingAddressResponse = OrderResponse.OrderAddressResponse.builder()
                .recipientName(addressParts[0])  // Parsed recipient name
                .phoneNumber(addressParts[1])     // Parsed phone
                .addressLine(addressParts[2])     // Street
                .ward(addressParts[3])            // Ward
                .district(addressParts[4])        // District
                .city(addressParts[5])            // City
                .fullAddress(order.getShippingAddress())
                .build();

        return OrderResponse.builder()
                .id(order.getOrderId())
                .orderId(order.getOrderId()) // Deprecated
                .orderCode(order.getOrderCode())
                // Customer info
                .customerId(customer != null ? customer.getUserId() : null)
                .customerName(customer != null ? customer.getFullName() : null)
                .customerPhone(customer != null ? customer.getPhoneNumber() : null)
                .customerEmail(customer != null ? customer.getEmail() : null)
                // Store/Supplier info
                .storeId(store != null ? store.getStoreId() : null)
                .storeName(store != null ? store.getStoreName() : null)
                .supplierId(supplier != null ? supplier.getUserId() : null)
                .supplierName(supplier != null ? supplier.getFullName() : null)
                // Items
                .items(items)
                // Status
                .status(orderStatus.name())
                .statusHistory(null) // TODO: Implement if OrderStatusHistory entity exists
                // Pricing
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discount(discount)
                .totalAmount(totalAmount)
                // Payment
                .paymentMethod(order.getPayment() != null && order.getPayment().getMethod() != null
                        ? order.getPayment().getMethod().name()
                        : null)
                .paymentStatus(paymentStatus.name())
                // Shipping
                .shippingAddress(shippingAddressResponse)
                .trackingNumber(order.getShipment() != null ? order.getShipment().getTrackingNumber() : null)
                .shipmentStatus(order.getShipment() != null && order.getShipment().getStatus() != null
                        ? order.getShipment().getStatus().name()
                        : null)
                // Notes
                .note(order.getNote())
                .cancelReason(order.getCancelReason())
                // Dates
                .estimatedDeliveryDate(
                        order.getEstimatedDelivery() != null ? order.getEstimatedDelivery().toString() : null)
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
        ProductVariant variant = storeProduct != null ? storeProduct.getVariant() : null;
        Product product = variant != null ? variant.getProduct() : null;

        String imageUrl = (product != null && product.getImages() != null && !product.getImages().isEmpty())
                ? product.getImages().get(0).getImageUrl()
                : null;

        int quantity = detail.getQuantity() > 0 ? detail.getQuantity() : 1;
        BigDecimal amount = detail.getAmount() != null ? detail.getAmount() : BigDecimal.ZERO;
        BigDecimal price = amount.divide(
                BigDecimal.valueOf(quantity),
                2,
                RoundingMode.HALF_UP);

        return OrderResponse.OrderItemResponse.builder()
                .id(detail.getOrderDetailId())
                .orderDetailId(detail.getOrderDetailId()) // Deprecated
                .productId(product != null ? product.getProductId() : null)
                .productName(product != null ? product.getName() : null)
                .variantId(variant != null ? variant.getVariantId() : null)
                .variantName(variant != null ? variant.getSku() : null)
                .imageUrl(imageUrl)
                .productImage(imageUrl) // Deprecated
                .quantity(detail.getQuantity())
                .price(price)
                .unitPrice(price) // Deprecated
                .subtotal(amount)
                .amount(amount) // Deprecated
                .canReview(detail.getOrder() != null && detail.getOrder().getStatus() == OrderStatus.DELIVERED)
                .hasReviewed(detail.getReview() != null)
                .build();
    }

    /**
     * Parse shipping address string to extract components
     * Format: "Nguyễn Văn A - 0901234567\n123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM"
     * Returns: [recipientName, phone, street, ward, district, city]
     */
    private String[] parseShippingAddress(String shippingAddress) {
        String[] result = new String[6];
        
        if (shippingAddress == null || shippingAddress.trim().isEmpty()) {
            return result; // Return array of nulls
        }

        try {
            // Split by newline
            String[] lines = shippingAddress.split("\n", 2);
            
            if (lines.length > 0) {
                // Parse first line: "Nguyễn Văn A - 0901234567"
                String[] recipientInfo = lines[0].split(" - ", 2);
                result[0] = recipientInfo.length > 0 ? recipientInfo[0].trim() : null; // recipientName
                result[1] = recipientInfo.length > 1 ? recipientInfo[1].trim() : null; // phone
            }
            
            if (lines.length > 1) {
                // Parse second line: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM"
                String[] addressParts = lines[1].split(",");
                result[2] = addressParts.length > 0 ? addressParts[0].trim() : null; // street
                result[3] = addressParts.length > 1 ? addressParts[1].trim() : null; // ward
                result[4] = addressParts.length > 2 ? addressParts[2].trim() : null; // district
                result[5] = addressParts.length > 3 ? addressParts[3].trim() : null; // city
            }
        } catch (Exception e) {
            log.warn("Failed to parse shipping address: {}", shippingAddress, e);
        }
        
        return result;
    }

    @Override
    public void handleDeliveryCompletionPublic(Order order) {
        handleDeliveryCompletion(order);
    }
}
