package com.example.backend.service;

import com.example.backend.dto.request.StoreCreateRequest;
import com.example.backend.dto.request.StoreUpdateRequest;
import com.example.backend.dto.response.StorePendingUpdateResponse;
import com.example.backend.dto.response.StoreResponse;
import com.example.backend.dto.response.StoreUpdateResponse;
import com.example.backend.entity.enums.StoreStatus;
import com.example.backend.entity.enums.SuggestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StoreService {

    /**
     * Get all stores for current supplier (authenticated)
     * @param keycloakId Supplier's Keycloak ID
     * @param status Filter by status (optional)
     * @param search Search by store name or address (optional)
     * @param pageable Pagination parameters
     * @return Page of stores
     */
    Page<StoreResponse> getMyStores(String keycloakId, StoreStatus status, String search, Pageable pageable);

    /**
     * Get store by ID (public access)
     * @param storeId Store ID
     * @return Store details
     */
    StoreResponse getStoreById(String storeId);

    /**
     * Create new store (requires admin approval)
     * @param request Store creation details
     * @param keycloakId Supplier's Keycloak ID
     * @return Created store (status: PENDING)
     */
    StoreResponse createStore(StoreCreateRequest request, String keycloakId);

    /**
     * Admin approves a pending store (change status to ACTIVE)
     * @param storeId Store ID
     * @param keycloakId Admin's Keycloak ID
     * @param adminNotes Optional approval notes
     * @return Approved store
     */
    StoreResponse approveStore(String storeId, String keycloakId, String adminNotes);

    /**
     * Admin rejects a pending store
     * @param storeId Store ID
     * @param keycloakId Admin's Keycloak ID
     * @param adminNotes Rejection reason
     * @return Rejected store
     */
    StoreResponse rejectStore(String storeId, String keycloakId, String adminNotes);

    /**
     * Supplier updates store information
     * Minor changes (description, openTime, closeTime, imageUrl) are applied immediately
     * Major changes (storeName, address, latitude, longitude, phoneNumber) require admin approval
     * @param storeId Store ID to update
     * @param request Update details
     * @param keycloakId Supplier's Keycloak ID
     * @return StoreUpdateResponse containing either immediate update or pending update
     */
    StoreUpdateResponse updateStore(String storeId, StoreUpdateRequest request, String keycloakId);

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
