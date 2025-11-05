package com.example.backend.service;

import com.example.backend.dto.request.CreateReturnRequestRequest;
import com.example.backend.dto.request.ReviewReturnRequestRequest;
import com.example.backend.dto.response.ReturnRequestResponse;
import org.springframework.data.domain.Page;

public interface ReturnRequestService {

    /**
     * Create a return request for a delivered order
     */
    ReturnRequestResponse createReturnRequest(String customerId, String orderId, CreateReturnRequestRequest request);

    /**
     * Approve a return request
     */
    ReturnRequestResponse approveReturnRequest(String returnRequestId, String reviewerId, ReviewReturnRequestRequest request);

    /**
     * Reject a return request
     */
    ReturnRequestResponse rejectReturnRequest(String returnRequestId, String reviewerId, ReviewReturnRequestRequest request);

    /**
     * Get return request by ID
     */
    ReturnRequestResponse getReturnRequestById(String returnRequestId);

    /**
     * Get return request by order ID
     */
    ReturnRequestResponse getReturnRequestByOrderId(String orderId);

    /**
     * Get customer's return requests
     */
    Page<ReturnRequestResponse> getCustomerReturnRequests(String customerId, int page, int size);

    /**
     * Get store's return requests
     */
    Page<ReturnRequestResponse> getStoreReturnRequests(String storeId, Boolean pending, int page, int size);

    /**
     * Get all pending return requests (for admin)
     */
    Page<ReturnRequestResponse> getAllPendingReturnRequests(int page, int size);
}
