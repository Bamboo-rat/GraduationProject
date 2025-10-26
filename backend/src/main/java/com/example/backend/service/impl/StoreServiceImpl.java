package com.example.backend.service.impl;

import com.example.backend.dto.request.StoreCreateRequest;
import com.example.backend.dto.request.StoreUpdateRequest;
import com.example.backend.dto.response.StorePendingUpdateResponse;
import com.example.backend.dto.response.StoreResponse;
import com.example.backend.dto.response.StoreUpdateResponse;
import com.example.backend.entity.Admin;
import com.example.backend.entity.Store;
import com.example.backend.entity.StorePendingUpdate;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.StoreStatus;
import com.example.backend.entity.enums.SuggestionStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.StoreMapper;
import com.example.backend.mapper.StorePendingUpdateMapper;
import com.example.backend.repository.StorePendingUpdateRepository;
import com.example.backend.repository.StoreRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.StoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final StorePendingUpdateRepository pendingUpdateRepository;
    private final UserRepository userRepository;
    private final StorePendingUpdateMapper updateMapper;
    private final StoreMapper storeMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<StoreResponse> getMyStores(String keycloakId, StoreStatus status, String search, Pageable pageable) {
        log.info("Getting stores for supplier: {}, status: {}, search: {}", keycloakId, status, search);

        // Find supplier
        Supplier supplier = (Supplier) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        Page<Store> stores;

        // Apply filters based on parameters
        if (status != null && search != null && !search.isBlank()) {
            stores = storeRepository.findBySupplierUserIdAndStatusAndSearch(
                    supplier.getUserId(), status, search, pageable);
        } else if (status != null) {
            stores = storeRepository.findBySupplierUserIdAndStatus(
                    supplier.getUserId(), status, pageable);
        } else if (search != null && !search.isBlank()) {
            stores = storeRepository.findBySupplierUserIdAndSearch(
                    supplier.getUserId(), search, pageable);
        } else {
            stores = storeRepository.findBySupplierUserId(supplier.getUserId(), pageable);
        }

        log.info("Found {} stores for supplier: {}", stores.getTotalElements(), keycloakId);
        return stores.map(storeMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public StoreResponse getStoreById(String storeId) {
        log.info("Getting store by ID: {}", storeId);

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORE_NOT_FOUND,
                        "Store not found with ID: " + storeId));

        return storeMapper.toResponse(store);
    }

    @Override
    @Transactional
    public StoreResponse createStore(StoreCreateRequest request, String keycloakId) {
        log.info("Creating new store for supplier: {}", keycloakId);

        // Find supplier
        Supplier supplier = (Supplier) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check if store name already exists for this supplier
        storeRepository.findByStoreNameAndSupplier(request.getStoreName(), supplier)
                .ifPresent(existingStore -> {
                    throw new ConflictException(ErrorCode.STORE_NAME_ALREADY_EXISTS,
                            "Store with name '" + request.getStoreName() + "' already exists for this supplier");
                });

        // Map request to entity
        Store store = storeMapper.toEntity(request);
        store.setSupplier(supplier);
        store.setStatus(StoreStatus.PENDING); // New stores require approval

        store = storeRepository.save(store);
        log.info("Store created successfully with ID: {} (status: PENDING, awaiting admin approval)",
                store.getStoreId());

        return storeMapper.toResponse(store);
    }

    @Override
    @Transactional
    public StoreResponse approveStore(String storeId, String keycloakId, String adminNotes) {
        log.info("Approving store: {} by admin: {}", storeId, keycloakId);

        // Find admin
        Admin admin = (Admin) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Find store
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORE_NOT_FOUND,
                        "Store not found with ID: " + storeId));

        // Validate status
        if (store.getStatus() != StoreStatus.PENDING) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Only PENDING stores can be approved. Current status: " + store.getStatus());
        }

        // Update status to ACTIVE
        store.setStatus(StoreStatus.ACTIVE);
        store = storeRepository.save(store);

        log.info("Store approved successfully: {} by admin: {}", storeId, admin.getFullName());
        return storeMapper.toResponse(store);
    }

    @Override
    @Transactional
    public StoreResponse rejectStore(String storeId, String keycloakId, String adminNotes) {
        log.info("Rejecting store: {} by admin: {}", storeId, keycloakId);

        // Find admin
        Admin admin = (Admin) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Find store
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORE_NOT_FOUND,
                        "Store not found with ID: " + storeId));

        // Validate status
        if (store.getStatus() != StoreStatus.PENDING) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST,
                    "Only PENDING stores can be rejected. Current status: " + store.getStatus());
        }

        // Update status to PERMANENTLY_CLOSED (since it was rejected)
        store.setStatus(StoreStatus.PERMANENTLY_CLOSED);
        store = storeRepository.save(store);

        log.info("Store rejected: {} by admin: {}, reason: {}", storeId, admin.getFullName(), adminNotes);
        return storeMapper.toResponse(store);
    }

    @Override
    @Transactional
    public StoreUpdateResponse updateStore(String storeId, StoreUpdateRequest request, String keycloakId) {
        log.info("Updating store: {} by supplier: {}", storeId, keycloakId);

        // Find supplier
        Supplier supplier = (Supplier) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Find store and validate ownership
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORE_NOT_FOUND,
                        "Store not found with ID: " + storeId));

        if (!store.getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED,
                    "You do not have permission to update this store");
        }

        // Determine if request contains major changes (require approval) or minor changes (immediate)
        boolean hasMajorChanges = hasMajorChanges(request, store);

        if (hasMajorChanges) {
            // Major changes: Create pending update for admin approval
            log.info("Store update contains major changes. Creating pending update for admin approval.");

            // Check if there's already a pending update for this store
            if (pendingUpdateRepository.hasStorePendingUpdate(storeId)) {
                throw new ConflictException(ErrorCode.INVALID_REQUEST,
                        "There is already a pending update for this store. Please wait for admin approval.");
            }

            // Create pending update
            StorePendingUpdate pendingUpdate = new StorePendingUpdate();
            pendingUpdate.setStore(store);
            pendingUpdate.setStoreName(request.getStoreName());
            pendingUpdate.setAddress(request.getAddress());
            pendingUpdate.setPhoneNumber(request.getPhoneNumber());
            pendingUpdate.setDescription(request.getDescription());
            pendingUpdate.setImageUrl(request.getImageUrl());

            if (request.getLatitude() != null) {
                pendingUpdate.setLatitude(request.getLatitude());
            }
            if (request.getLongitude() != null) {
                pendingUpdate.setLongitude(request.getLongitude());
            }
            if (request.getStatus() != null) {
                pendingUpdate.setStatus(request.getStatus());
            }

            pendingUpdate.setUpdateStatus(SuggestionStatus.PENDING);
            pendingUpdate = pendingUpdateRepository.save(pendingUpdate);

            log.info("Pending update created: {}", pendingUpdate.getUpdateId());

            return StoreUpdateResponse.builder()
                    .updateType(StoreUpdateResponse.UpdateType.PENDING)
                    .pendingUpdate(updateMapper.toResponse(pendingUpdate))
                    .message("Store update submitted successfully. Major changes (name, address, location) require admin approval.")
                    .build();

        } else {
            // Minor changes only: Apply immediately
            log.info("Store update contains only minor changes. Applying immediately.");

            // Apply minor changes
            if (request.getDescription() != null) {
                store.setDescription(request.getDescription());
            }
            if (request.getImageUrl() != null) {
                store.setImageUrl(request.getImageUrl());
            }
            if (request.getOpenTime() != null) {
                store.setOpenTime(request.getOpenTime());
            }
            if (request.getCloseTime() != null) {
                store.setCloseTime(request.getCloseTime());
            }

            store = storeRepository.save(store);
            log.info("Store updated immediately: {}", storeId);

            return StoreUpdateResponse.builder()
                    .updateType(StoreUpdateResponse.UpdateType.IMMEDIATE)
                    .store(storeMapper.toResponse(store))
                    .message("Store updated successfully. Minor changes applied immediately.")
                    .build();
        }
    }

    /**
     * Check if update request contains major changes that require admin approval
     * Major changes: storeName, address, latitude, longitude, phoneNumber
     * Minor changes: description, imageUrl, openTime, closeTime
     */
    private boolean hasMajorChanges(StoreUpdateRequest request, Store currentStore) {
        // Check for store name change
        if (request.getStoreName() != null &&
            !request.getStoreName().equals(currentStore.getStoreName())) {
            return true;
        }

        // Check for address change
        if (request.getAddress() != null &&
            !request.getAddress().equals(currentStore.getAddress())) {
            return true;
        }

        // Check for phone number change
        if (request.getPhoneNumber() != null &&
            !request.getPhoneNumber().equals(currentStore.getPhoneNumber())) {
            return true;
        }

        // Check for latitude change
        if (request.getLatitude() != null &&
            !request.getLatitude().equals(currentStore.getLatitude())) {
            return true;
        }

        // Check for longitude change
        if (request.getLongitude() != null &&
            !request.getLongitude().equals(currentStore.getLongitude())) {
            return true;
        }

        // No major changes detected
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StorePendingUpdateResponse> getAllPendingUpdates(SuggestionStatus status, Pageable pageable) {
        Page<StorePendingUpdate> updates;

        if (status != null) {
            updates = pendingUpdateRepository.findByUpdateStatus(status, pageable);
        } else {
            updates = pendingUpdateRepository.findAll(pageable);
        }

        return updates.map(updateMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public StorePendingUpdateResponse getPendingUpdateById(String updateId) {
        StorePendingUpdate update = pendingUpdateRepository.findById(updateId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        return updateMapper.toResponse(update);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StorePendingUpdateResponse> getPendingUpdatesByStore(String storeId, Pageable pageable) {
        Page<StorePendingUpdate> updates = pendingUpdateRepository.findByStoreStoreId(storeId, pageable);
        return updates.map(updateMapper::toResponse);
    }

    @Override
    @Transactional
    public StorePendingUpdateResponse approveStoreUpdate(String updateId, String keycloakId, String adminNotes) {
        log.info("Approving store update: {} by admin: {}", updateId, keycloakId);

        // Find admin
        Admin admin = (Admin) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Find pending update
        StorePendingUpdate pendingUpdate = pendingUpdateRepository.findById(updateId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // Validate status
        if (pendingUpdate.getUpdateStatus() != SuggestionStatus.PENDING) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, 
                    "Only PENDING updates can be approved");
        }

        // Apply updates to store
        Store store = pendingUpdate.getStore();
        
        if (pendingUpdate.getStoreName() != null) {
            store.setStoreName(pendingUpdate.getStoreName());
        }
        if (pendingUpdate.getAddress() != null) {
            store.setAddress(pendingUpdate.getAddress());
        }
        if (pendingUpdate.getPhoneNumber() != null) {
            store.setPhoneNumber(pendingUpdate.getPhoneNumber());
        }
        if (pendingUpdate.getDescription() != null) {
            store.setDescription(pendingUpdate.getDescription());
        }
        if (pendingUpdate.getLatitude() != null) {
            store.setLatitude(pendingUpdate.getLatitude());
        }
        if (pendingUpdate.getLongitude() != null) {
            store.setLongitude(pendingUpdate.getLongitude());
        }
        if (pendingUpdate.getImageUrl() != null) {
            store.setImageUrl(pendingUpdate.getImageUrl());
        }
        if (pendingUpdate.getStatus() != null) {
            store.setStatus(pendingUpdate.getStatus());
        }

        storeRepository.save(store);

        // Update pending update status
        pendingUpdate.setUpdateStatus(SuggestionStatus.APPROVED);
        pendingUpdate.setAdminNotes(adminNotes);
        pendingUpdate.setAdmin(admin);
        pendingUpdate.setProcessedAt(LocalDateTime.now());

        pendingUpdate = pendingUpdateRepository.save(pendingUpdate);
        log.info("Store update approved and applied: {}", updateId);

        return updateMapper.toResponse(pendingUpdate);
    }

    @Override
    @Transactional
    public StorePendingUpdateResponse rejectStoreUpdate(String updateId, String keycloakId, String adminNotes) {
        log.info("Rejecting store update: {} by admin: {}", updateId, keycloakId);

        // Find admin
        Admin admin = (Admin) userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Find pending update
        StorePendingUpdate pendingUpdate = pendingUpdateRepository.findById(updateId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        // Validate status
        if (pendingUpdate.getUpdateStatus() != SuggestionStatus.PENDING) {
            throw new BadRequestException(ErrorCode.INVALID_REQUEST, 
                    "Only PENDING updates can be rejected");
        }

        // Update pending update status
        pendingUpdate.setUpdateStatus(SuggestionStatus.REJECTED);
        pendingUpdate.setAdminNotes(adminNotes);
        pendingUpdate.setAdmin(admin);
        pendingUpdate.setProcessedAt(LocalDateTime.now());

        pendingUpdate = pendingUpdateRepository.save(pendingUpdate);
        log.info("Store update rejected: {}", updateId);

        return updateMapper.toResponse(pendingUpdate);
    }
}
