package com.example.backend.mapper;

import com.example.backend.dto.response.SupplierResponse;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.Store;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for Supplier entity to DTO conversion
 */
@Component
public class SupplierMapper {

    /**
     * Convert Supplier entity to SupplierResponse DTO
     */
    public SupplierResponse toResponse(Supplier supplier) {
        if (supplier == null) {
            return null;
        }

        return SupplierResponse.builder()
                .userId(supplier.getUserId())
                .keycloakId(supplier.getKeycloakId())
                .username(supplier.getUsername())
                .email(supplier.getEmail())
                .phoneNumber(supplier.getPhoneNumber())
                .fullName(supplier.getFullName())
                .active(supplier.isActive())
                .businessName(supplier.getBusinessName())
                .businessLicense(supplier.getBusinessLicense())
                .businessLicenseUrl(supplier.getBusinessLicenseUrl())
                .taxCode(supplier.getTaxCode())
                .logoUrl(supplier.getLogoUrl())
                .status(supplier.getStatus() != null ? supplier.getStatus().name() : null)
                .stores(mapStores(supplier.getStores()))
                .totalProducts(supplier.getProducts() != null ? supplier.getProducts().size() : 0)
                .totalStores(supplier.getStores() != null ? supplier.getStores().size() : 0)
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
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
}
