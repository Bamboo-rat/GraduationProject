package com.example.backend.repository;

import com.example.backend.entity.CategorySuggestion;
import com.example.backend.entity.enums.SuggestionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CategorySuggestionRepository extends JpaRepository<CategorySuggestion, String> {

    /**
     * Find suggestions by status
     */
    Page<CategorySuggestion> findByStatus(SuggestionStatus status, Pageable pageable);

    /**
     * Find suggestions by supplier
     */
    Page<CategorySuggestion> findBySupplierUserId(String supplierUserId, Pageable pageable);

    /**
     * Find suggestions by supplier and status
     */
    Page<CategorySuggestion> findBySupplierUserIdAndStatus(String supplierUserId, SuggestionStatus status, Pageable pageable);

    /**
     * Check if category name already exists (case-insensitive)
     */
    @Query("SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END FROM CategorySuggestion cs WHERE LOWER(cs.name) = LOWER(:name) AND cs.status = 'PENDING'")
    boolean existsByNameIgnoreCaseAndStatusPending(String name);

    /**
     * Count pending suggestions
     */
    long countByStatus(SuggestionStatus status);
}
