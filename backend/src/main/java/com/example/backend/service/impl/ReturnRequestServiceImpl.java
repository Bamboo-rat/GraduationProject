package com.example.backend.service.impl;

import com.example.backend.dto.request.CreateReturnRequestRequest;
import com.example.backend.dto.request.ReviewReturnRequestRequest;
import com.example.backend.dto.response.ReturnRequestResponse;
import com.example.backend.entity.Customer;
import com.example.backend.entity.Order;
import com.example.backend.entity.OrderCancelRequest;
import com.example.backend.entity.Store;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.CancelRequestStatus;
import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.OrderRequestType;
import com.example.backend.entity.enums.ReturnRequestStatus;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.entity.OrderDetail;
import com.example.backend.entity.Payment;
import com.example.backend.entity.StoreProduct;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.entity.enums.PaymentStatus;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.OrderCancelRequestRepository;
import com.example.backend.repository.OrderDetailRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.PaymentRepository;
import com.example.backend.repository.StoreProductRepository;
import com.example.backend.repository.StoreRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.InAppNotificationService;
import com.example.backend.service.ReturnRequestService;
import com.example.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReturnRequestServiceImpl implements ReturnRequestService {

    private final OrderCancelRequestRepository cancelRequestRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final PaymentRepository paymentRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final StoreProductRepository storeProductRepository;
    private final WalletService walletService;
    private final InAppNotificationService notificationService;

    private static final int RETURN_DAYS_LIMIT = 7;

    @Override
    @Transactional
    public ReturnRequestResponse createReturnRequest(String customerId, String orderId, CreateReturnRequestRequest request) {
        log.info("Creating return request for order: {}", orderId);

        // Validate order exists and belongs to customer
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, "Order does not belong to customer");
        }

        // Check order status - must be DELIVERED
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException(ErrorCode.ORDER_NOT_DELIVERED, 
                "Can only create return request for delivered orders");
        }

        // Check if return request already exists
        cancelRequestRepository.findByOrderAndRequestType(order, OrderRequestType.RETURN)
                .ifPresent(existing -> {
                    throw new BadRequestException(ErrorCode.RETURN_REQUEST_ALREADY_EXISTS, 
                        "Return request already exists for this order");
                });

        // Check return time limit (7 days from delivery)
        LocalDateTime deliveredAt = order.getDeliveredAt();
        if (deliveredAt != null) {
            long daysSinceDelivery = ChronoUnit.DAYS.between(deliveredAt, LocalDateTime.now());
            if (daysSinceDelivery > RETURN_DAYS_LIMIT) {
                throw new BadRequestException(ErrorCode.RETURN_PERIOD_EXPIRED,
                    String.format("Return period expired. Can only return within %d days of delivery", RETURN_DAYS_LIMIT)
                );
            }
        }

        // Get customer entity
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CUSTOMER_NOT_FOUND));

        // Create return request
        OrderCancelRequest returnRequest = new OrderCancelRequest();
        returnRequest.setOrder(order);
        returnRequest.setCustomer(customer);
        returnRequest.setRequestType(OrderRequestType.RETURN);
        returnRequest.setReturnReason(request.getReason());
        returnRequest.setReason(request.getDescription());
        returnRequest.setImageUrls(request.getImageUrls() != null ? request.getImageUrls() : null);
        returnRequest.setStatus(CancelRequestStatus.PENDING_REVIEW);

        returnRequest = cancelRequestRepository.save(returnRequest);
        log.info("Return request created: {}", returnRequest.getCancelRequestId());

        return mapToResponse(returnRequest);
    }

    @Override
    @Transactional
    public ReturnRequestResponse approveReturnRequest(String returnRequestId, String reviewerId, ReviewReturnRequestRequest request) {
        log.info("Approving return request: {}", returnRequestId);

        // 1. Validate return request
        OrderCancelRequest returnRequest = cancelRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        if (returnRequest.getStatus() != CancelRequestStatus.PENDING_REVIEW) {
            throw new BadRequestException(ErrorCode.INVALID_RETURN_STATUS,
                "Can only approve pending return requests");
        }

        Order order = returnRequest.getOrder();

        // Check if order is already returned
        if (order.getStatus() == OrderStatus.RETURNED) {
            throw new BadRequestException(ErrorCode.ORDER_ALREADY_RETURNED,
                "Order has already been returned");
        }

        try {
            // 2. Process refund to supplier wallet
            String supplierId = order.getStore().getSupplier().getUserId();
            boolean isPending = !order.isBalanceReleased();

            log.info("Processing refund for order: {}, supplier: {}, isPending: {}",
                order.getOrderId(), supplierId, isPending);

            walletService.refundOrder(supplierId, order, order.getTotalAmount(), isPending);

            // 3. Update payment status to REFUNDED
            Payment payment = paymentRepository.findByOrder(order)
                    .orElseThrow(() -> new NotFoundException(ErrorCode.PAYMENT_NOT_FOUND));

            payment.setStatus(PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            log.info("Payment status updated to REFUNDED for order: {}", order.getOrderId());

            // 4. Restore inventory (add products back to stock)
            restoreInventory(order);

            // 5. Update return request status
            returnRequest.setStatus(CancelRequestStatus.APPROVED);
            returnRequest.setReviewedBy(reviewerId);
            returnRequest.setReviewNote(request.getReviewNote());
            returnRequest.setReviewedAt(LocalDateTime.now());
            returnRequest.setRefundAmount(order.getTotalAmount().doubleValue());

            // 6. Update order status to RETURNED
            order.setStatus(OrderStatus.RETURNED);

            returnRequest = cancelRequestRepository.save(returnRequest);
            orderRepository.save(order);

            // 7. Send notification to customer
            String notificationContent = String.format(
                "Yêu cầu trả hàng của bạn cho đơn hàng #%s đã được chấp nhận. " +
                "Số tiền %,.0f VNĐ sẽ được hoàn lại vào tài khoản của bạn.",
                order.getOrderCode(),
                order.getTotalAmount()
            );

            notificationService.createNotificationForUser(
                returnRequest.getCustomer().getUserId(),
                NotificationType.ORDER_STATUS_UPDATE,
                notificationContent,
                "/orders/" + order.getOrderId()
            );

            log.info("Return request approved successfully: {}", returnRequestId);

            return mapToResponse(returnRequest);

        } catch (NotFoundException e) {
            log.error("Not found error during return approval: {}", e.getMessage());
            throw e;
        } catch (BadRequestException e) {
            log.error("Bad request error during return approval: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Failed to process return refund for request: {}", returnRequestId, e);
            throw new BadRequestException(ErrorCode.REFUND_PROCESSING_FAILED,
                "Failed to process refund: " + e.getMessage());
        }
    }

    /**
     * Restore inventory when return is approved
     * Adds returned products back to store stock
     */
    private void restoreInventory(Order order) {
        try {
            log.info("Restoring inventory for order: {}", order.getOrderId());

            // Get all order details for this order
            var orderDetails = orderDetailRepository.findByOrder(order);

            for (OrderDetail detail : orderDetails) {
                StoreProduct storeProduct = detail.getStoreProduct();
                int returnedQuantity = detail.getQuantity();

                // Add returned quantity back to stock
                int currentStock = storeProduct.getStockQuantity();
                int newStock = currentStock + returnedQuantity;
                storeProduct.setStockQuantity(newStock);

                storeProductRepository.save(storeProduct);

                log.info("Restored {} units to StoreProduct: {} (from {} to {})",
                    returnedQuantity,
                    storeProduct.getStoreProductId(),
                    currentStock,
                    newStock
                );
            }

            log.info("Inventory restored successfully for order: {}", order.getOrderId());

        } catch (Exception e) {
            log.error("Failed to restore inventory for order: {}", order.getOrderId(), e);
            throw new BadRequestException(ErrorCode.INVENTORY_RESTORATION_FAILED,
                "Failed to restore inventory: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ReturnRequestResponse rejectReturnRequest(String returnRequestId, String reviewerId, ReviewReturnRequestRequest request) {
        log.info("Rejecting return request: {}", returnRequestId);

        OrderCancelRequest returnRequest = cancelRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        if (returnRequest.getStatus() != CancelRequestStatus.PENDING_REVIEW) {
            throw new BadRequestException(ErrorCode.INVALID_RETURN_STATUS,
                "Can only reject pending return requests");
        }

        // Update return request
        returnRequest.setStatus(CancelRequestStatus.REJECTED);
        returnRequest.setReviewedBy(reviewerId);
        returnRequest.setReviewNote(request.getReviewNote());
        returnRequest.setReviewedAt(LocalDateTime.now());

        returnRequest = cancelRequestRepository.save(returnRequest);

        // Send notification to customer
        Order order = returnRequest.getOrder();
        String notificationContent = String.format(
            "Yêu cầu trả hàng của bạn cho đơn hàng #%s đã bị từ chối. " +
            "Lý do: %s",
            order.getOrderCode(),
            request.getReviewNote() != null ? request.getReviewNote() : "Không đủ điều kiện trả hàng"
        );

        notificationService.createNotificationForUser(
            returnRequest.getCustomer().getUserId(),
            NotificationType.ORDER_STATUS_UPDATE,
            notificationContent,
            "/orders/" + order.getOrderId()
        );

        log.info("Return request rejected: {}", returnRequestId);

        return mapToResponse(returnRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnRequestResponse getReturnRequestById(String returnRequestId) {
        OrderCancelRequest returnRequest = cancelRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        return mapToResponse(returnRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnRequestResponse getReturnRequestByOrderId(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));
        
        OrderCancelRequest returnRequest = cancelRequestRepository.findByOrderAndRequestType(
                order, OrderRequestType.RETURN)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        return mapToResponse(returnRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReturnRequestResponse> getCustomerReturnRequests(String customerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.CUSTOMER_NOT_FOUND));
        
        Page<OrderCancelRequest> returnRequests = cancelRequestRepository
                .findByCustomerAndRequestType(customer, OrderRequestType.RETURN, pageable);

        return returnRequests.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReturnRequestResponse> getStoreReturnRequests(String storeId, Boolean pending, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORE_NOT_FOUND));
        
        Page<OrderCancelRequest> returnRequests;

        if (Boolean.TRUE.equals(pending)) {
            returnRequests = cancelRequestRepository.findByOrderStoreAndRequestTypeAndStatus(
                    store, OrderRequestType.RETURN, CancelRequestStatus.PENDING_REVIEW, pageable);
        } else {
            returnRequests = cancelRequestRepository.findByOrderStoreAndRequestType(
                    store, OrderRequestType.RETURN, pageable);
        }

        return returnRequests.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReturnRequestResponse> getAllPendingReturnRequests(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderCancelRequest> returnRequests = cancelRequestRepository.findByRequestTypeAndStatus(
                OrderRequestType.RETURN, CancelRequestStatus.PENDING_REVIEW, pageable);

        return returnRequests.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReturnRequestResponse> getSupplierReturnRequests(String supplierId, Boolean pending, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderCancelRequest> returnRequests;

        if (Boolean.TRUE.equals(pending)) {
            returnRequests = cancelRequestRepository.findBySupplierAndRequestTypeAndStatus(
                    supplierId, OrderRequestType.RETURN, CancelRequestStatus.PENDING_REVIEW, pageable);
        } else {
            returnRequests = cancelRequestRepository.findBySupplierAndRequestType(
                    supplierId, OrderRequestType.RETURN, pageable);
        }

        return returnRequests.map(this::mapToResponse);
    }

    private ReturnRequestResponse mapToResponse(OrderCancelRequest returnRequest) {
        Order order = returnRequest.getOrder();
        Customer customer = returnRequest.getCustomer();
        Store store = order.getStore();

        String reviewerName = null;
        if (returnRequest.getReviewedBy() != null) {
            reviewerName = userRepository.findById(returnRequest.getReviewedBy())
                    .map(User::getFullName)
                    .orElse("Unknown");
        }

        return ReturnRequestResponse.builder()
                .id(returnRequest.getCancelRequestId())
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .customerId(customer.getUserId())
                .customerName(customer.getFullName())
                .storeId(store.getStoreId())
                .storeName(store.getStoreName())
                .reason(returnRequest.getReturnReason())
                .reasonDescription(returnRequest.getReturnReason() != null ? 
                    returnRequest.getReturnReason().getDescription() : null)
                .description(returnRequest.getReason())
                .imageUrls(returnRequest.getImageUrls())
                .status(mapCancelStatusToReturnStatus(returnRequest.getStatus()))
                .statusDescription(returnRequest.getStatus().name())
                .reviewerId(returnRequest.getReviewedBy())
                .reviewerName(reviewerName)
                .reviewNote(returnRequest.getReviewNote())
                .reviewedAt(returnRequest.getReviewedAt())
                .refundAmount(returnRequest.getRefundAmount())
                .orderTotalAmount(order.getTotalAmount().doubleValue())
                .createdAt(returnRequest.getRequestedAt())
                .updatedAt(returnRequest.getReviewedAt() != null ? 
                    returnRequest.getReviewedAt() : returnRequest.getRequestedAt())
                .build();
    }

    private ReturnRequestStatus mapCancelStatusToReturnStatus(
            CancelRequestStatus status) {
        return switch (status) {
            case PENDING_REVIEW -> ReturnRequestStatus.PENDING;
            case APPROVED -> ReturnRequestStatus.APPROVED;
            case REJECTED -> ReturnRequestStatus.REJECTED;
        };
    }
}
