package com.example.backend.service;

import com.example.backend.dto.response.SearchHistoryResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface SearchHistoryService {

    /**
     * Record a search query for a customer
     * @param customerId Customer ID
     * @param searchQuery Search query text
     */
    void recordSearch(String customerId, String searchQuery);

    /**
     * Get all search history for a customer with pagination
     * @param customerId Customer ID
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return Paginated search history
     */
    Page<SearchHistoryResponse> getSearchHistory(String customerId, int page, int size);

    /**
     * Get recent search history (last 30 days)
     * @param customerId Customer ID
     * @param page Page number
     * @param size Page size
     * @return Recent search history
     */
    Page<SearchHistoryResponse> getRecentSearchHistory(String customerId, int page, int size);

    /**
     * Get unique/distinct search queries for a customer
     * @param customerId Customer ID
     * @return List of unique search queries
     */
    List<String> getUniqueSearchQueries(String customerId);

    /**
     * Delete a specific search history entry
     * @param searchId Search history ID
     * @param customerId Customer ID (for authorization)
     * @return true if deleted, false if not found or unauthorized
     */
    boolean deleteSearchHistory(String searchId, String customerId);

    /**
     * Delete all search history for a customer
     * @param customerId Customer ID
     */
    void deleteAllSearchHistory(String customerId);

    /**
     * Delete search history older than specified days
     * @param customerId Customer ID
     * @param daysOld Number of days (e.g., 30 for older than 30 days)
     */
    void deleteOldSearchHistory(String customerId, int daysOld);

    /**
     * Get total search count for a customer
     * @param customerId Customer ID
     * @return Total number of searches
     */
    long getSearchCount(String customerId);
}
