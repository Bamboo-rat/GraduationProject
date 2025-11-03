package com.example.backend.service.impl;

import com.example.backend.dto.request.CancelOrderRequest;
import com.example.backend.dto.request.CreateCancelRequestRequest;
import com.example.backend.dto.request.ReviewCancelRequestRequest;
import com.example.backend.dto.response.CancelRequestResponse;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.*;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.*;
import com.example.backend.service.InAppNotificationService;
import com.example.backend.service.OrderCancelRequestService;
import com.example.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderCancelRequestServiceImpl implements OrderCancelRequestService {

    private final OrderCancelRequestRepository cancelRequestRepository;
    private final OrderRepository orderRepository;
    private final InAppNotificationService notificationService;
    private final OrderService orderService;

    @Override
    @Transactional
    public CancelRequestResponse createCancelRequest(String customerId, String orderId, CreateCancelRequestRequest request) {
        log.info("Creating cancel request: customerId={}, orderId={}", customerId, orderId);

        // Get order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        // Verify ownership
        if (!order.getCustomer().getUserId().equals(customerId)) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "Bạn không có quyền tạo yêu cầu hủy cho đơn hàng này");
        }

        // Validate order status
        if (order.getStatus() != OrderStatus.PREPARING &&
            order.getStatus() != OrderStatus.SHIPPING) {
            throw new BadRequestException(ErrorCode.INVALID_ORDER_STATUS,
                    "Chỉ có thể tạo yêu cầu hủy cho đơn hàng đang ở trạng thái PREPARING hoặc SHIPPING. " +
                    "Trạng thái hiện tại: " + order.getStatus());
        }

        // Check if cancel request already exists
        if (cancelRequestRepository.existsPendingRequestByOrder(order)) {
            throw new BadRequestException(ErrorCode.RESOURCE_ALREADY_EXISTS,
                    "Đơn hàng này đã có yêu cầu hủy đang chờ xét duyệt");
        }

        // Create cancel request
        OrderCancelRequest cancelRequest = new OrderCancelRequest();
        cancelRequest.setOrder(order);
        cancelRequest.setCustomer(order.getCustomer());
        cancelRequest.setReason(request.getReason());
        cancelRequest.setStatus(CancelRequestStatus.PENDING_REVIEW);

        cancelRequest = cancelRequestRepository.save(cancelRequest);

        // Notify supplier
        notificationService.createNotificationForUser(
                order.getStore().getSupplier().getUserId(),
                NotificationType.ORDER_STATUS_UPDATE,
                String.format("Khách hàng %s yêu cầu hủy đơn hàng #%s. Lý do: %s",
                        order.getCustomer().getFullName(),
                        order.getOrderCode(),
                        request.getReason()),
                "/orders/" + order.getOrderId() + "/cancel-requests"
        );

        log.info("Cancel request created: cancelRequestId={}, orderId={}", 
                cancelRequest.getCancelRequestId(), orderId);

        return mapToResponse(cancelRequest);
    }

    @Override
    @Transactional
    public CancelRequestResponse reviewCancelRequest(String cancelRequestId, String reviewerId, ReviewCancelRequestRequest request) {
        log.info("Reviewing cancel request: cancelRequestId={}, reviewerId={}, approved={}", 
                cancelRequestId, reviewerId, request.getApproved());

        // Get cancel request
        OrderCancelRequest cancelRequest = cancelRequestRepository.findById(cancelRequestId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy yêu cầu hủy đơn"));

        // Check if already reviewed
        if (cancelRequest.getStatus() != CancelRequestStatus.PENDING_REVIEW) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Yêu cầu hủy đơn này đã được xét duyệt");
        }

        // Verify reviewer is supplier of the store or admin
        // (Authorization should be handled at controller level)

        // Update cancel request
        cancelRequest.setStatus(request.getApproved() ? CancelRequestStatus.APPROVED : CancelRequestStatus.REJECTED);
        cancelRequest.setReviewedAt(LocalDateTime.now());
        cancelRequest.setReviewedBy(reviewerId);
        cancelRequest.setReviewNote(request.getReviewNote());

        cancelRequest = cancelRequestRepository.save(cancelRequest);

        Order order = cancelRequest.getOrder();

        if (request.getApproved()) {
            // APPROVED: Cancel the order
            log.info("Cancel request approved, canceling order: orderId={}", order.getOrderId());

            try {
                // Use OrderService to cancel (with refund, inventory return, etc.)
                CancelOrderRequest cancelOrderRequest = new CancelOrderRequest();
                cancelOrderRequest.setReason("Đã được phê duyệt hủy bởi nhà cung cấp. Lý do khách hàng: " + cancelRequest.getReason());
                cancelOrderRequest.setCustomerFault(false); // Supplier approved, not customer's fault
                
                orderService.cancelOrder(order.getStore().getSupplier().getUserId(), order.getOrderId(), cancelOrderRequest);

                // Notify customer: approved
                notificationService.createNotificationForUser(
                        order.getCustomer().getUserId(),
                        NotificationType.ORDER_STATUS_UPDATE,
                        String.format("Yêu cầu hủy đơn hàng #%s đã được phê duyệt. %s",
                                order.getOrderCode(),
                                order.getPayment() != null && order.getPayment().getStatus() == PaymentStatus.REFUNDED
                                        ? "Tiền đã được hoàn lại." : ""),
                        "/orders/" + order.getOrderId()
                );

                log.info("Order canceled successfully after approval: orderId={}", order.getOrderId());

            } catch (Exception e) {
                log.error("Failed to cancel order after approval: orderId={}", order.getOrderId(), e);
                throw new BadRequestException(ErrorCode.INTERNAL_SERVER_ERROR,
                        "Không thể hủy đơn hàng: " + e.getMessage());
            }

        } else {
            // REJECTED: Notify customer
            notificationService.createNotificationForUser(
                    order.getCustomer().getUserId(),
                    NotificationType.ORDER_STATUS_UPDATE,
                    String.format("Yêu cầu hủy đơn hàng #%s bị từ chối. %s",
                            order.getOrderCode(),
                            request.getReviewNote() != null ? "Lý do: " + request.getReviewNote() : ""),
                    "/orders/" + order.getOrderId()
            );

            log.info("Cancel request rejected: cancelRequestId={}, orderId={}", cancelRequestId, order.getOrderId());
        }

        return mapToResponse(cancelRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public CancelRequestResponse getCancelRequestById(String cancelRequestId) {
        OrderCancelRequest cancelRequest = cancelRequestRepository.findById(cancelRequestId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy yêu cầu hủy đơn"));
        return mapToResponse(cancelRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public CancelRequestResponse getCancelRequestByOrderId(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.ORDER_NOT_FOUND));

        OrderCancelRequest cancelRequest = cancelRequestRepository.findByOrder(order)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy yêu cầu hủy cho đơn hàng này"));

        return mapToResponse(cancelRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CancelRequestResponse> getCustomerCancelRequests(String customerId, int page, int size) {
        log.info("Getting cancel requests for customer: customerId={}", customerId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "requestedAt"));
        Page<OrderCancelRequest> requests = cancelRequestRepository.findByCustomerId(customerId, pageable);

        return requests.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CancelRequestResponse> getStoreCancelRequests(String storeId, boolean pending, int page, int size) {
        log.info("Getting cancel requests for store: storeId={}, pending={}", storeId, pending);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "requestedAt"));
        
        Page<OrderCancelRequest> requests = pending
                ? cancelRequestRepository.findPendingByStoreId(storeId, pageable)
                : cancelRequestRepository.findByStoreId(storeId, pageable);

        return requests.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CancelRequestResponse> getAllPendingCancelRequests(int page, int size) {
        log.info("Getting all pending cancel requests");

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "requestedAt"));
        Page<OrderCancelRequest> requests = cancelRequestRepository.findAllPending(pageable);

        return requests.map(this::mapToResponse);
    }

    // Helper method
    private CancelRequestResponse mapToResponse(OrderCancelRequest cancelRequest) {
        Order order = cancelRequest.getOrder();
        
        String reviewedByName = null;
        if (cancelRequest.getReviewedBy() != null) {
            // Try to get reviewer name (could be supplier or admin)
            reviewedByName = "Nhà cung cấp"; // Default, could be enhanced to fetch actual name
        }

        return CancelRequestResponse.builder()
                .cancelRequestId(cancelRequest.getCancelRequestId())
                .orderId(order.getOrderId())
                .orderCode(order.getOrderCode())
                .customerId(cancelRequest.getCustomer().getUserId())
                .customerName(cancelRequest.getCustomer().getFullName())
                .storeId(order.getStore().getStoreId())
                .storeName(order.getStore().getStoreName())
                .reason(cancelRequest.getReason())
                .status(cancelRequest.getStatus())
                .requestedAt(cancelRequest.getRequestedAt())
                .reviewedAt(cancelRequest.getReviewedAt())
                .reviewedBy(cancelRequest.getReviewedBy())
                .reviewedByName(reviewedByName)
                .reviewNote(cancelRequest.getReviewNote())
                .orderStatus(order.getStatus().toString())
                .totalAmount(order.getTotalAmount().toString())
                .build();
    }
}
