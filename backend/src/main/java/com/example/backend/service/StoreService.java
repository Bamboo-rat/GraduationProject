package com.example.backend.service;

import com.example.backend.dto.request.StoreCreateRequest;
import com.example.backend.dto.request.StoreUpdateRequest;
import com.example.backend.dto.response.*;
import com.example.backend.entity.enums.StoreStatus;
import com.example.backend.entity.enums.SuggestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StoreService {

    /**
     * Get all stores in the system (Admin only)
     * @param status Filter by status (optional)
     * @param supplierId Filter by supplier ID (optional)
     * @param search Search by store name or address (optional)
     * @param pageable Pagination parameters
     * @return Page of all stores
     */
    Page<StoreResponse> getAllStores(StoreStatus status, String supplierId, String search, Pageable pageable);

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
     * Get nearby stores within specified radius (public access for customers)
     * @param latitude Customer's current latitude
     * @param longitude Customer's current longitude
     * @param radiusKm Search radius in kilometers (default: 5km)
     * @param pageable Pagination parameters
     * @return Page of nearby stores
     */
    Page<StoreResponse> getNearbyStores(double latitude, double longitude, double radiusKm, Pageable pageable);

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
     * Admin suspends an active store (change status to SUSPENDED)
     * @param storeId Store ID
     * @param keycloakId Admin's Keycloak ID
     * @param reason Suspension reason
     * @return Suspended store
     */
    StoreResponse suspendStore(String storeId, String keycloakId, String reason);

    /**
     * Admin unsuspends a suspended store (change status back to ACTIVE)
     * @param storeId Store ID
     * @param keycloakId Admin's Keycloak ID
     * @param adminNotes Optional notes
     * @return Reactivated store
     */
    StoreResponse unsuspendStore(String storeId, String keycloakId, String adminNotes);

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
     * Get pending updates for current supplier (Supplier only)
     * @param keycloakId Supplier's Keycloak ID
     * @param status Filter by status (optional)
     * @param pageable Pagination parameters
     * @return Page of supplier's pending updates
     */
    Page<StorePendingUpdateResponse> getMyPendingUpdates(String keycloakId, SuggestionStatus status, Pageable pageable);

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

    /**
     * Get all product variants available at a specific store (Public access)
     * Returns detailed variant-level data with stock information for this store
     * Only returns data for ACTIVE stores
     * @param storeId Store ID
     * @param pageable Pagination parameters
     * @return Page of product variants with store-specific inventory
     */
    Page<StoreProductVariantResponse> getProductVariantsForStore(String storeId, Pageable pageable);

    /**
     * Get all product variants for a store (Supplier access for inventory management)
     * Returns detailed variant-level data with stock information for this store
     * Works for stores in ANY status (PENDING, ACTIVE, SUSPENDED, etc.)
     * Suppliers need to see inventory regardless of store status
     * @param storeId Store ID
     * @param keycloakId Supplier's Keycloak ID (for ownership verification)
     * @param pageable Pagination parameters
     * @return Page of product variants with store-specific inventory
     */
    Page<StoreProductVariantResponse> getProductVariantsForStoreManagement(String storeId, String keycloakId, Pageable pageable);
}
