package com.example.backend.service;

import com.example.backend.dto.request.StoreUpdateRequest;
import com.example.backend.dto.response.StorePendingUpdateResponse;
import com.example.backend.entity.enums.SuggestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StoreService {

    /**
     * Supplier submits a store update request (creates pending update)
     * @param storeId Store ID to update
     * @param request Update details
     * @param keycloakId Supplier's Keycloak ID
     * @return Created pending update
     */
    StorePendingUpdateResponse submitStoreUpdate(String storeId, StoreUpdateRequest request, String keycloakId);

    /**
     * Get all pending store updates (Admin only)
     * @param status Filter by status (optional)
     * @param pageable Pagination parameters
     * @return Page of pending updates
     */
    Page<StorePendingUpdateResponse> getAllPendingUpdates(SuggestionStatus status, Pageable pageable);

    /**
     * Get pending update by ID
     * @param updateId Update ID
     * @return Pending update details
     */
    StorePendingUpdateResponse getPendingUpdateById(String updateId);

    /**
     * Get pending updates for a specific store
     * @param storeId Store ID
     * @param pageable Pagination parameters
     * @return Page of pending updates for the store
     */
    Page<StorePendingUpdateResponse> getPendingUpdatesByStore(String storeId, Pageable pageable);

    /**
     * Admin approves a store update and applies the changes
     * @param updateId Update ID
     * @param keycloakId Admin's Keycloak ID
     * @param adminNotes Optional notes from admin
     * @return Approved update
     */
    StorePendingUpdateResponse approveStoreUpdate(String updateId, String keycloakId, String adminNotes);

    /**
     * Admin rejects a store update
     * @param updateId Update ID
     * @param keycloakId Admin's Keycloak ID
     * @param adminNotes Reason for rejection
     * @return Rejected update
     */
    StorePendingUpdateResponse rejectStoreUpdate(String updateId, String keycloakId, String adminNotes);
}
