package com.example.backend.service.impl;

import com.example.backend.dto.response.SearchHistoryResponse;
import com.example.backend.entity.Customer;
import com.example.backend.entity.SearchHistory;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.SearchHistoryMapper;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.SearchHistoryRepository;
import com.example.backend.service.SearchHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchHistoryServiceImpl implements SearchHistoryService {

    private final SearchHistoryRepository searchHistoryRepository;
    private final CustomerRepository customerRepository;
    private final SearchHistoryMapper searchHistoryMapper;

    @Override
    @Transactional
    public void recordSearch(String customerId, String searchQuery) {
        log.debug("Recording search for customer {}: {}", customerId, searchQuery);

        if (searchQuery == null || searchQuery.trim().isEmpty()) {
            log.warn("Empty search query provided for customer {}", customerId);
            return;
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        SearchHistory searchHistory = new SearchHistory();
        searchHistory.setCustomer(customer);
        searchHistory.setSearchQuery(searchQuery.trim());

        searchHistoryRepository.save(searchHistory);
        log.debug("Search recorded successfully for customer {}", customerId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SearchHistoryResponse> getSearchHistory(String customerId, int page, int size) {
        log.info("Getting search history for customer {}: page={}, size={}", customerId, page, size);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<SearchHistory> searchHistoryPage = searchHistoryRepository
                .findByCustomerUserIdOrderBySearchedAtDesc(customerId, pageable);

        return searchHistoryPage.map(searchHistoryMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SearchHistoryResponse> getRecentSearchHistory(String customerId, int page, int size) {
        log.info("Getting recent search history for customer {}: page={}, size={}", customerId, page, size);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        Pageable pageable = PageRequest.of(page, size);
        Page<SearchHistory> searchHistoryPage = searchHistoryRepository
                .findRecentSearches(customerId, thirtyDaysAgo, pageable);

        return searchHistoryPage.map(searchHistoryMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getUniqueSearchQueries(String customerId) {
        log.info("Getting unique search queries for customer {}", customerId);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        return searchHistoryRepository.findDistinctSearchQueriesByCustomer(customerId);
    }

    @Override
    @Transactional
    public boolean deleteSearchHistory(String searchId, String customerId) {
        log.info("Deleting search history {} for customer {}", searchId, customerId);

        int deletedCount = searchHistoryRepository.deleteBySearchIdAndCustomerUserId(searchId, customerId);

        if (deletedCount > 0) {
            log.info("Search history {} deleted successfully", searchId);
            return true;
        } else {
            log.warn("Search history {} not found or unauthorized for customer {}", searchId, customerId);
            return false;
        }
    }

    @Override
    @Transactional
    public void deleteAllSearchHistory(String customerId) {
        log.info("Deleting all search history for customer {}", customerId);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        searchHistoryRepository.deleteByCustomerUserId(customerId);
        log.info("All search history deleted for customer {}", customerId);
    }

    @Override
    @Transactional
    public void deleteOldSearchHistory(String customerId, int daysOld) {
        log.info("Deleting search history older than {} days for customer {}", daysOld, customerId);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        searchHistoryRepository.deleteOldSearchHistory(customerId, cutoffDate);
        log.info("Old search history deleted for customer {} (older than {} days)", customerId, daysOld);
    }

    @Override
    @Transactional(readOnly = true)
    public long getSearchCount(String customerId) {
        log.debug("Getting search count for customer {}", customerId);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        return searchHistoryRepository.countByCustomerUserId(customerId);
    }
}
