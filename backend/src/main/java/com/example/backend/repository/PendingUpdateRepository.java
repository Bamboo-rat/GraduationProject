package com.example.backend.repository;

import com.example.backend.entity.PendingUpdate;
import com.example.backend.entity.enums.SuggestionStatus;
import com.example.backend.entity.enums.UpdateEntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PendingUpdate entity
 * Handles both Store and Supplier pending updates
 */
@Repository
public interface PendingUpdateRepository extends JpaRepository<PendingUpdate, String> {

    /**
     * Find all pending updates for a specific entity
     */
    List<PendingUpdate> findByEntityTypeAndEntityId(UpdateEntityType entityType, String entityId);

    /**
     * Find pending update by entity and status
     */
    Optional<PendingUpdate> findByEntityTypeAndEntityIdAndUpdateStatus(
            UpdateEntityType entityType, 
            String entityId, 
            SuggestionStatus status
    );

    /**
     * Find all updates by entity type and status
     */
    Page<PendingUpdate> findByEntityTypeAndUpdateStatus(
            UpdateEntityType entityType, 
            SuggestionStatus status, 
            Pageable pageable
    );

    /**
     * Find all updates by entity type (regardless of status)
     */
    Page<PendingUpdate> findByEntityType(UpdateEntityType entityType, Pageable pageable);

    /**
     * Find all updates by status (across all entity types)
     */
    Page<PendingUpdate> findByUpdateStatus(SuggestionStatus status, Pageable pageable);

    /**
     * Count pending updates by entity type
     */
    @Query("SELECT COUNT(pu) FROM PendingUpdate pu WHERE pu.entityType = :entityType AND pu.updateStatus = :status")
    long countByEntityTypeAndStatus(
            @Param("entityType") UpdateEntityType entityType, 
            @Param("status") SuggestionStatus status
    );

    /**
     * Check if entity has pending update
     */
    boolean existsByEntityTypeAndEntityIdAndUpdateStatus(
            UpdateEntityType entityType, 
            String entityId, 
            SuggestionStatus status
    );

    /**
     * Find all pending updates for stores (for backward compatibility)
     */
    @Query("SELECT pu FROM PendingUpdate pu WHERE pu.entityType = 'STORE' AND pu.updateStatus = :status")
    Page<PendingUpdate> findStorePendingUpdates(@Param("status") SuggestionStatus status, Pageable pageable);

    /**
     * Find all pending updates for suppliers (for backward compatibility)
     */
    @Query("SELECT pu FROM PendingUpdate pu WHERE pu.entityType = 'SUPPLIER' AND pu.updateStatus = :status")
    Page<PendingUpdate> findSupplierPendingUpdates(@Param("status") SuggestionStatus status, Pageable pageable);

    /**
     * Find updates by supplier reference (direct relationship)
     */
    @Query("SELECT pu FROM PendingUpdate pu WHERE pu.supplier.userId = :supplierId")
    List<PendingUpdate> findBySupplierUserId(@Param("supplierId") String supplierId);

    /**
     * Find updates by store reference (direct relationship)
     */
    @Query("SELECT pu FROM PendingUpdate pu WHERE pu.store.storeId = :storeId")
    List<PendingUpdate> findByStoreStoreId(@Param("storeId") String storeId);

    /**
     * Find store pending updates by supplier ID and status (paginated)
     */
    @Query("SELECT pu FROM PendingUpdate pu WHERE pu.store.supplier.userId = :supplierId " +
           "AND pu.entityType = 'STORE' AND pu.updateStatus = :status")
    Page<PendingUpdate> findStoreUpdatesBySupplierAndStatus(
            @Param("supplierId") String supplierId, 
            @Param("status") SuggestionStatus status, 
            Pageable pageable
    );

    /**
     * Find store pending updates by supplier ID (paginated)
     */
    @Query("SELECT pu FROM PendingUpdate pu WHERE pu.store.supplier.userId = :supplierId " +
           "AND pu.entityType = 'STORE'")
    Page<PendingUpdate> findStoreUpdatesBySupplier(
            @Param("supplierId") String supplierId, 
            Pageable pageable
    );

    /**
     * Find store updates by store ID (paginated)
     */
    @Query("SELECT pu FROM PendingUpdate pu WHERE pu.store.storeId = :storeId")
    Page<PendingUpdate> findByStoreId(@Param("storeId") String storeId, Pageable pageable);

    /**
     * Find supplier updates by supplier ID and status (paginated)
     */
    @Query("SELECT pu FROM PendingUpdate pu WHERE pu.supplier.userId = :supplierId " +
           "AND pu.entityType = 'SUPPLIER' AND pu.updateStatus = :status")
    Page<PendingUpdate> findSupplierUpdatesBySupplierAndStatus(
            @Param("supplierId") String supplierId, 
            @Param("status") SuggestionStatus status, 
            Pageable pageable
    );

    /**
     * Find supplier updates by supplier ID (paginated)
     */
    @Query("SELECT pu FROM PendingUpdate pu WHERE pu.supplier.userId = :supplierId " +
           "AND pu.entityType = 'SUPPLIER'")
    Page<PendingUpdate> findSupplierUpdatesBySupplier(
            @Param("supplierId") String supplierId, 
            Pageable pageable
    );
}
