package com.example.backend.service.impl;

import com.example.backend.dto.request.StoreUpdateRequest;
import com.example.backend.dto.response.StorePendingUpdateResponse;
import com.example.backend.entity.Admin;
import com.example.backend.entity.Store;
import com.example.backend.entity.StorePendingUpdate;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.SuggestionStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.BadRequestException;
import com.example.backend.exception.custom.ConflictException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.StorePendingUpdateMapper;
import com.example.backend.repository.AdminRepository;
import com.example.backend.repository.StorePendingUpdateRepository;
import com.example.backend.repository.StoreRepository;
import com.example.backend.repository.SupplierRepository;
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
    private final SupplierRepository supplierRepository;
    private final AdminRepository adminRepository;
    private final StorePendingUpdateMapper updateMapper;

    @Override
    @Transactional
    public StorePendingUpdateResponse submitStoreUpdate(String storeId, StoreUpdateRequest request, String keycloakId) {
        log.info("Submitting store update for store: {} by supplier: {}", storeId, keycloakId);

        // Find supplier
        Supplier supplier = supplierRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND));

        // Find store and validate ownership
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!store.getSupplier().getUserId().equals(supplier.getUserId())) {
            throw new BadRequestException(ErrorCode.UNAUTHORIZED, 
                    "You do not have permission to update this store");
        }

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
        log.info("Store update submitted successfully: {}", pendingUpdate.getUpdateId());

        return updateMapper.toResponse(pendingUpdate);
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
        Admin admin = adminRepository.findByKeycloakId(keycloakId)
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
        Admin admin = adminRepository.findByKeycloakId(keycloakId)
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
