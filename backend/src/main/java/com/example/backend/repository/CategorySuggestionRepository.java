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
     * Find suggestions by status with eager loading
     */
    @Query(value = "SELECT DISTINCT cs FROM CategorySuggestion cs " +
            "LEFT JOIN FETCH cs.supplier " +
            "LEFT JOIN FETCH cs.admin " +
            "WHERE cs.status = :status",
            countQuery = "SELECT COUNT(cs) FROM CategorySuggestion cs WHERE cs.status = :status")
    Page<CategorySuggestion> findByStatus(SuggestionStatus status, Pageable pageable);

    /**
     * Find all suggestions with eager loading
     */
    @Query(value = "SELECT DISTINCT cs FROM CategorySuggestion cs " +
            "LEFT JOIN FETCH cs.supplier " +
            "LEFT JOIN FETCH cs.admin",
            countQuery = "SELECT COUNT(cs) FROM CategorySuggestion cs")
    Page<CategorySuggestion> findAllWithDetails(Pageable pageable);

    /**
     * Find suggestions by supplier with eager loading
     */
    @Query(value = "SELECT DISTINCT cs FROM CategorySuggestion cs " +
            "LEFT JOIN FETCH cs.supplier " +
            "LEFT JOIN FETCH cs.admin " +
            "WHERE cs.supplier.userId = :supplierUserId",
            countQuery = "SELECT COUNT(cs) FROM CategorySuggestion cs WHERE cs.supplier.userId = :supplierUserId")
    Page<CategorySuggestion> findBySupplierUserId(String supplierUserId, Pageable pageable);

    /**
     * Find suggestions by supplier and status with eager loading
     */
    @Query(value = "SELECT DISTINCT cs FROM CategorySuggestion cs " +
            "LEFT JOIN FETCH cs.supplier " +
            "LEFT JOIN FETCH cs.admin " +
            "WHERE cs.supplier.userId = :supplierUserId AND cs.status = :status",
            countQuery = "SELECT COUNT(cs) FROM CategorySuggestion cs WHERE cs.supplier.userId = :supplierUserId AND cs.status = :status")
    Page<CategorySuggestion> findBySupplierUserIdAndStatus(String supplierUserId, SuggestionStatus status, Pageable pageable);

    /**
     * Find suggestion by ID with eager loading
     */
    @Query("SELECT cs FROM CategorySuggestion cs " +
           "LEFT JOIN FETCH cs.supplier " +
           "LEFT JOIN FETCH cs.admin " +
           "WHERE cs.suggestionId = :id")
    java.util.Optional<CategorySuggestion> findByIdWithDetails(String id);

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
