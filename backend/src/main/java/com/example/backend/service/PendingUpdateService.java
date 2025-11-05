package com.example.backend.service;

import com.example.backend.entity.PendingUpdate;
import com.example.backend.entity.enums.SuggestionStatus;
import com.example.backend.entity.enums.UpdateEntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for managing pending updates (Store and Supplier)
 * Unified service replacing StorePendingUpdateService and SupplierPendingUpdateService
 */
public interface PendingUpdateService {

    /**
     * Create a new pending update request
     */
    PendingUpdate createPendingUpdate(PendingUpdate pendingUpdate);

    /**
     * Get pending update by ID
     */
    Optional<PendingUpdate> getPendingUpdateById(String updateId);

    /**
     * Get all pending updates for a specific entity
     */
    List<PendingUpdate> getPendingUpdatesByEntity(UpdateEntityType entityType, String entityId);

    /**
     * Get pending update by entity and status
     */
    Optional<PendingUpdate> getPendingUpdateByEntityAndStatus(
            UpdateEntityType entityType, 
            String entityId, 
            SuggestionStatus status
    );

    /**
     * Get all updates by entity type and status (paginated)
     */
    Page<PendingUpdate> getPendingUpdatesByTypeAndStatus(
            UpdateEntityType entityType, 
            SuggestionStatus status, 
            Pageable pageable
    );

    /**
     * Get all updates by status (paginated)
     */
    Page<PendingUpdate> getPendingUpdatesByStatus(SuggestionStatus status, Pageable pageable);

    /**
     * Approve a pending update
     */
    PendingUpdate approvePendingUpdate(String updateId, String adminId, String adminNotes);

    /**
     * Reject a pending update
     */
    PendingUpdate rejectPendingUpdate(String updateId, String adminId, String adminNotes);

    /**
     * Check if entity has pending update
     */
    boolean hasPendingUpdate(UpdateEntityType entityType, String entityId);

    /**
     * Count pending updates by type
     */
    long countPendingUpdatesByType(UpdateEntityType entityType, SuggestionStatus status);

    /**
     * Delete a pending update
     */
    void deletePendingUpdate(String updateId);

    // ==================== CONVENIENCE METHODS ====================

    /**
     * Get all pending store updates
     */
    Page<PendingUpdate> getPendingStoreUpdates(SuggestionStatus status, Pageable pageable);

    /**
     * Get all pending supplier updates
     */
    Page<PendingUpdate> getPendingSupplierUpdates(SuggestionStatus status, Pageable pageable);

    /**
     * Get pending updates by store ID
     */
    List<PendingUpdate> getPendingUpdatesByStoreId(String storeId);

    /**
     * Get pending updates by supplier ID
     */
    List<PendingUpdate> getPendingUpdatesBySupplierId(String supplierId);
}
