package com.example.backend.repository;

import com.example.backend.entity.SupplierPendingUpdate;
import com.example.backend.entity.enums.SuggestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * Repository for SupplierPendingUpdate entity
 */
@Repository
public interface SupplierPendingUpdateRepository extends JpaRepository<SupplierPendingUpdate, String> {

    /**
     * Find all pending updates with optional status filter
     */
    Page<SupplierPendingUpdate> findByUpdateStatus(SuggestionStatus status, Pageable pageable);

    /**
     * Find all pending updates with optional status filter (alias method)
     */
    Page<SupplierPendingUpdate> findAllByUpdateStatus(SuggestionStatus status, Pageable pageable);

    /**
     * Find pending updates by supplier ID
     */
    Page<SupplierPendingUpdate> findBySupplierUserId(String supplierId, Pageable pageable);

    /**
     * Find pending updates by supplier ID and status
     */
    Page<SupplierPendingUpdate> findBySupplierUserIdAndUpdateStatus(
            String supplierId, 
            SuggestionStatus status, 
            Pageable pageable
    );

    /**
     * Check if supplier has any pending update with specific status
     */
    boolean existsBySupplierUserIdAndUpdateStatus(String supplierId, SuggestionStatus status);

    /**
     * Check if supplier has any pending update
     */
    @Query("SELECT COUNT(u) > 0 FROM SupplierPendingUpdate u " +
           "WHERE u.supplier.userId = :supplierId " +
           "AND u.updateStatus = 'PENDING'")
    boolean hasSupplierPendingUpdate(String supplierId);
}
