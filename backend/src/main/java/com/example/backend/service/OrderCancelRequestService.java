package com.example.backend.service;

import com.example.backend.dto.request.CreateCancelRequestRequest;
import com.example.backend.dto.request.ReviewCancelRequestRequest;
import com.example.backend.dto.response.CancelRequestResponse;
import org.springframework.data.domain.Page;

/**
 * Service for managing order cancel requests
 * Handles the approval workflow for canceling orders from PREPARING status onwards
 */
public interface OrderCancelRequestService {

    /**
     * Customer creates a cancel request for an order
     * 
     * @param customerId Customer ID
     * @param orderId Order ID
     * @param request Cancel request details
     * @return Created cancel request
     */
    CancelRequestResponse createCancelRequest(String customerId, String orderId, CreateCancelRequestRequest request);

    /**
     * Supplier/Admin reviews (approves or rejects) a cancel request
     * 
     * @param cancelRequestId Cancel request ID
     * @param reviewerId Reviewer user ID (supplier or admin)
     * @param request Review decision
     * @return Updated cancel request
     */
    CancelRequestResponse reviewCancelRequest(String cancelRequestId, String reviewerId, ReviewCancelRequestRequest request);

    /**
     * Get cancel request by ID
     * 
     * @param cancelRequestId Cancel request ID
     * @return Cancel request details
     */
    CancelRequestResponse getCancelRequestById(String cancelRequestId);

    /**
     * Get cancel request by order ID
     * 
     * @param orderId Order ID
     * @return Cancel request details
     */
    CancelRequestResponse getCancelRequestByOrderId(String orderId);

    /**
     * Get all cancel requests by customer
     * 
     * @param customerId Customer ID
     * @param page Page number
     * @param size Page size
     * @return Page of cancel requests
     */
    Page<CancelRequestResponse> getCustomerCancelRequests(String customerId, int page, int size);

    /**
     * Get all cancel requests for a store (for supplier to review)
     * 
     * @param storeId Store ID
     * @param pending Filter only pending requests
     * @param page Page number
     * @param size Page size
     * @return Page of cancel requests
     */
    Page<CancelRequestResponse> getStoreCancelRequests(String storeId, boolean pending, int page, int size);

    /**
     * Get all pending cancel requests (for admin)
     * 
     * @param page Page number
     * @param size Page size
     * @return Page of cancel requests
     */
    Page<CancelRequestResponse> getAllPendingCancelRequests(int page, int size);
}
