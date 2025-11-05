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
import com.example.backend.enums.OrderRequestType;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.ErrorCode;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.OrderCancelRequestRepository;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.StoreRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.ReturnRequestService;
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

        OrderCancelRequest returnRequest = cancelRequestRepository.findById(returnRequestId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        if (returnRequest.getStatus() != CancelRequestStatus.PENDING_REVIEW) {
            throw new BadRequestException(ErrorCode.INVALID_RETURN_STATUS, 
                "Can only approve pending return requests");
        }

        // Update return request
        returnRequest.setStatus(CancelRequestStatus.APPROVED);
        returnRequest.setReviewedBy(reviewerId);
        returnRequest.setReviewNote(request.getReviewNote());
        returnRequest.setReviewedAt(LocalDateTime.now());
        returnRequest.setRefundAmount(returnRequest.getOrder().getTotalAmount().doubleValue());

        // Update order status to RETURNED
        Order order = returnRequest.getOrder();
        order.setStatus(OrderStatus.RETURNED);

        returnRequest = cancelRequestRepository.save(returnRequest);
        orderRepository.save(order);

        log.info("Return request approved: {}", returnRequestId);

        return mapToResponse(returnRequest);
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

    private com.example.backend.enums.ReturnRequestStatus mapCancelStatusToReturnStatus(
            CancelRequestStatus status) {
        return switch (status) {
            case PENDING_REVIEW -> com.example.backend.enums.ReturnRequestStatus.PENDING;
            case APPROVED -> com.example.backend.enums.ReturnRequestStatus.APPROVED;
            case REJECTED -> com.example.backend.enums.ReturnRequestStatus.REJECTED;
        };
    }
}
