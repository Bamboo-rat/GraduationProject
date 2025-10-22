package com.example.backend.repository;

import com.example.backend.entity.StorePendingUpdate;
import com.example.backend.entity.enums.SuggestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StorePendingUpdateRepository extends JpaRepository<StorePendingUpdate, String> {

    /**
     * Find pending updates by status
     */
    Page<StorePendingUpdate> findByUpdateStatus(SuggestionStatus status, Pageable pageable);

    /**
     * Find pending updates by store ID
     */
    Page<StorePendingUpdate> findByStoreStoreId(String storeStoreId, Pageable pageable);

    /**
     * Find pending update by store ID and status PENDING
     */
    Optional<StorePendingUpdate> findByStoreStoreIdAndUpdateStatus(String storeStoreId, SuggestionStatus status);

    /**
     * Check if store has pending update
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM StorePendingUpdate u WHERE u.store.storeId = :storeId AND u.updateStatus = 'PENDING'")
    boolean hasStorePendingUpdate(String storeId);

    /**
     * Count pending updates
     */
    long countByUpdateStatus(SuggestionStatus status);
}
