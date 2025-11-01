package com.example.backend.service.impl;

import com.example.backend.dto.response.FavoriteStoreResponse;
import com.example.backend.dto.response.StoreResponse;
import com.example.backend.entity.Customer;
import com.example.backend.entity.FavoriteStore;
import com.example.backend.entity.Store;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.StoreMapper;
import com.example.backend.repository.CustomerRepository;
import com.example.backend.repository.FavoriteStoreRepository;
import com.example.backend.repository.StoreRepository;
import com.example.backend.service.FavoriteStoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of FavoriteStoreService
 * Handles customer favorite store operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteStoreServiceImpl implements FavoriteStoreService {

    private final FavoriteStoreRepository favoriteStoreRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final StoreMapper storeMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<FavoriteStoreResponse> getFavoriteStores(String customerId, int page, int size) {
        log.info("Getting favorite stores for customer: {}, page: {}, size: {}", customerId, page, size);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<FavoriteStore> favoritePage = favoriteStoreRepository.findByCustomerId(customerId, pageable);

        log.info("Found {} favorite stores for customer: {}", favoritePage.getTotalElements(), customerId);

        return favoritePage.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FavoriteStoreResponse> getMostOrderedFavorites(String customerId, int page, int size) {
        log.info("Getting most ordered favorite stores for customer: {}, page: {}, size: {}",
                 customerId, page, size);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<FavoriteStore> favoritePage = favoriteStoreRepository.findMostOrderedByCustomerId(customerId, pageable);

        log.info("Found {} most ordered favorite stores for customer: {}",
                 favoritePage.getTotalElements(), customerId);

        return favoritePage.map(this::toResponse);
    }

    @Override
    @Transactional
    public FavoriteStoreResponse addFavoriteStore(String customerId, String storeId) {
        log.info("Adding store {} to favorites for customer: {}", storeId, customerId);

        // Get customer
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Get store
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // Check if already favorited
        if (favoriteStoreRepository.existsByCustomerIdAndStoreId(customerId, storeId)) {
            log.info("Store {} is already in favorites for customer: {}", storeId, customerId);
            FavoriteStore existing = favoriteStoreRepository.findByCustomerIdAndStoreId(customerId, storeId)
                    .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));
            return toResponse(existing);
        }

        // Create new favorite
        FavoriteStore favoriteStore = new FavoriteStore();
        favoriteStore.setCustomer(customer);
        favoriteStore.setStore(store);
        favoriteStore.setOrderCount(0);

        favoriteStore = favoriteStoreRepository.save(favoriteStore);
        log.info("Store {} added to favorites successfully for customer: {}", storeId, customerId);

        return toResponse(favoriteStore);
    }

    @Override
    @Transactional
    public void removeFavoriteStore(String customerId, String storeId) {
        log.info("Removing store {} from favorites for customer: {}", storeId, customerId);

        // Find favorite with security check
        FavoriteStore favoriteStore = favoriteStoreRepository.findByCustomerIdAndStoreId(customerId, storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        favoriteStoreRepository.delete(favoriteStore);
        log.info("Store {} removed from favorites successfully for customer: {}", storeId, customerId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavorited(String customerId, String storeId) {
        log.info("Checking if store {} is favorited by customer: {}", storeId, customerId);

        boolean isFavorited = favoriteStoreRepository.existsByCustomerIdAndStoreId(customerId, storeId);
        log.info("Store {} favorite status for customer {}: {}", storeId, customerId, isFavorited);

        return isFavorited;
    }

    @Override
    @Transactional(readOnly = true)
    public long getFavoriteCount(String customerId) {
        log.info("Getting favorite count for customer: {}", customerId);

        // Verify customer exists
        if (!customerRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
        }

        long count = favoriteStoreRepository.countByCustomerId(customerId);
        log.info("Favorite count for customer {}: {}", customerId, count);

        return count;
    }

    /**
     * Convert FavoriteStore entity to FavoriteStoreResponse DTO
     */
    private FavoriteStoreResponse toResponse(FavoriteStore favoriteStore) {
        StoreResponse storeResponse = storeMapper.toResponse(favoriteStore.getStore());

        return FavoriteStoreResponse.builder()
                .favoriteId(favoriteStore.getFavoriteId())
                .store(storeResponse)
                .createdAt(favoriteStore.getCreatedAt())
                .orderCount(favoriteStore.getOrderCount())
                .lastOrderDate(favoriteStore.getLastOrderDate())
                .build();
    }
}
