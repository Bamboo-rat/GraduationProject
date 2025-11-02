package com.example.backend.repository;

import com.example.backend.entity.SearchHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, String> {

    /**
     * Find all search history for a customer with pagination
     */
    Page<SearchHistory> findByCustomerUserIdOrderBySearchedAtDesc(String customerId, Pageable pageable);

    /**
     * Find all search history for a customer
     */
    List<SearchHistory> findByCustomerUserIdOrderBySearchedAtDesc(String customerId);

    /**
     * Find recent search history (last N days)
     */
    @Query("SELECT s FROM SearchHistory s WHERE s.customer.userId = :customerId " +
           "AND s.searchedAt >= :since ORDER BY s.searchedAt DESC")
    Page<SearchHistory> findRecentSearches(
            @Param("customerId") String customerId,
            @Param("since") LocalDateTime since,
            Pageable pageable);

    /**
     * Find unique/distinct search queries for a customer
     */
    @Query("SELECT DISTINCT s.searchQuery FROM SearchHistory s " +
           "WHERE s.customer.userId = :customerId " +
           "ORDER BY s.searchQuery ASC")
    List<String> findDistinctSearchQueriesByCustomer(@Param("customerId") String customerId);

    /**
     * Delete all search history for a customer
     */
    @Modifying
    @Query("DELETE FROM SearchHistory s WHERE s.customer.userId = :customerId")
    void deleteByCustomerUserId(@Param("customerId") String customerId);

    /**
     * Delete search history older than specified date for a customer
     */
    @Modifying
    @Query("DELETE FROM SearchHistory s WHERE s.customer.userId = :customerId " +
           "AND s.searchedAt < :before")
    void deleteOldSearchHistory(
            @Param("customerId") String customerId,
            @Param("before") LocalDateTime before);

    /**
     * Delete specific search history entry
     */
    @Modifying
    @Query("DELETE FROM SearchHistory s WHERE s.searchId = :searchId " +
           "AND s.customer.userId = :customerId")
    int deleteBySearchIdAndCustomerUserId(
            @Param("searchId") String searchId,
            @Param("customerId") String customerId);

    /**
     * Count total searches for a customer
     */
    long countByCustomerUserId(String customerId);

    /**
     * Check if search query exists for customer
     */
    boolean existsByCustomerUserIdAndSearchQuery(String customerId, String searchQuery);
}
