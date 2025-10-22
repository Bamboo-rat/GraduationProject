package com.example.backend.mapper;

import com.example.backend.dto.request.SupplierBankUpdateRequest;
import com.example.backend.dto.request.SupplierCommissionUpdateRequest;
import com.example.backend.dto.response.SupplierResponse;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.Store;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for Supplier entity to DTO conversion
 * Using manual mapping due to complex nested objects and conditional field visibility
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SupplierMapper {

    /**
     * Convert Supplier entity to SupplierResponse DTO (full info for admin)
     */
    public SupplierResponse toResponse(Supplier supplier) {
        if (supplier == null) {
            return null;
        }

        // Get document URLs - they are already publicly accessible from Cloudinary
        String businessLicenseUrl = supplier.getBusinessLicenseUrl();
        String foodSafetyCertificateUrl = supplier.getFoodSafetyCertificateUrl();

        return SupplierResponse.builder()
                .userId(supplier.getUserId())
                .keycloakId(supplier.getKeycloakId())
                .username(supplier.getUsername())
                .email(supplier.getEmail())
                .phoneNumber(supplier.getPhoneNumber())
                .fullName(supplier.getFullName())
                .avatarUrl(supplier.getAvatarUrl())
                .active(supplier.isActive())
                .businessName(supplier.getBusinessName())
                .businessLicense(supplier.getBusinessLicense())
                .businessLicenseUrl(businessLicenseUrl)
                .foodSafetyCertificate(supplier.getFoodSafetyCertificate())
                .foodSafetyCertificateUrl(foodSafetyCertificateUrl)
                .taxCode(supplier.getTaxCode())
                .businessAddress(supplier.getBusinessAddress())
                .businessType(supplier.getBusinessType())
                .commissionRate(supplier.getCommissionRate())
                .status(supplier.getStatus() != null ? supplier.getStatus().name() : null)
                .stores(mapStores(supplier.getStores()))
                .totalProducts(supplier.getProducts() != null ? supplier.getProducts().size() : 0)
                .totalStores(supplier.getStores() != null ? supplier.getStores().size() : 0)
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }

    /**
     * Convert Supplier entity to SupplierResponse DTO (public info - hide sensitive data)
     */
    public SupplierResponse toPublicResponse(Supplier supplier) {
        if (supplier == null) {
            return null;
        }

        return SupplierResponse.builder()
                .userId(supplier.getUserId())
                .username(supplier.getUsername())
                .email(supplier.getEmail())
                .phoneNumber(supplier.getPhoneNumber())
                .fullName(supplier.getFullName())
                .avatarUrl(supplier.getAvatarUrl())
                .active(supplier.isActive())
                .businessName(supplier.getBusinessName())
                .businessAddress(supplier.getBusinessAddress())
                .businessType(supplier.getBusinessType())
                .status(supplier.getStatus() != null ? supplier.getStatus().name() : null)
                .stores(mapStores(supplier.getStores()))
                .totalProducts(supplier.getProducts() != null ? supplier.getProducts().size() : 0)
                .totalStores(supplier.getStores() != null ? supplier.getStores().size() : 0)
                .createdAt(supplier.getCreatedAt())
                .build();
    }

    /**
     * Convert list of Supplier entities to list of SupplierResponse DTOs
     */
    public List<SupplierResponse> toResponseList(List<Supplier> suppliers) {
        if (suppliers == null) {
            return List.of();
        }
        return suppliers.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Map stores to basic info DTOs
     */
    private List<SupplierResponse.StoreBasicInfo> mapStores(List<Store> stores) {
        if (stores == null) {
            return List.of();
        }
        return stores.stream()
                .map(store -> SupplierResponse.StoreBasicInfo.builder()
                        .storeId(store.getStoreId())
                        .storeName(store.getStoreName())
                        .address(store.getAddress())
                        .phoneNumber(store.getPhoneNumber())
                        .status(store.getStatus() != null ? store.getStatus().name() : null)
                        .build())
                .collect(Collectors.toList());
    }

    // ========== Update Methods ==========

    /**
     * Update supplier commission rate from DTO (Admin only)
     */
    public void updateCommissionRate(Supplier supplier, SupplierCommissionUpdateRequest request) {
        if (supplier == null || request == null) {
            return;
        }
        if (request.getCommissionRate() != null) {
            supplier.setCommissionRate(request.getCommissionRate());
        }
    }
}
