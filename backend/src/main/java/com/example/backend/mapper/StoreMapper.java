package com.example.backend.mapper;

import com.example.backend.dto.request.StoreCreateRequest;
import com.example.backend.dto.request.StoreUpdateRequest;
import com.example.backend.dto.response.StoreResponse;
import com.example.backend.entity.Store;
import com.example.backend.entity.enums.StoreStatus;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct Mapper for Store entity
 */
@Mapper(componentModel = "spring")
public interface StoreMapper {

    /**
     * Convert Store entity to StoreResponse DTO
     */

    @Mapping(target = "status", source = "status", qualifiedByName = "storeStatusToString")
    @Mapping(target = "supplierId", source = "supplier.userId")
    @Mapping(target = "supplierName", source = "supplier.businessName")
    @Mapping(target = "totalProducts", expression = "java(store.getStoreProducts() != null ? store.getStoreProducts().size() : 0)")
    @Mapping(target = "street", source = "street")
    @Mapping(target = "ward", source = "ward")
    @Mapping(target = "district", source = "district")
    @Mapping(target = "province", source = "province")
    StoreResponse toResponse(Store store);

    /**
     * Convert list of Store entities to list of StoreResponse DTOs
     */
    List<StoreResponse> toResponseList(List<Store> stores);

    /**
     * Convert StoreCreateRequest to Store entity
     */
    @Mapping(target = "storeId", ignore = true)
    @Mapping(target = "supplier", ignore = true)
    @Mapping(target = "storeProducts", ignore = true)
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "carts", ignore = true)
    @Mapping(target = "favoritedBy", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "totalReviews", ignore = true)
    @Mapping(target = "status", constant = "ACTIVE")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "street", source = "street")
    @Mapping(target = "ward", source = "ward")
    @Mapping(target = "district", source = "district")
    @Mapping(target = "province", source = "province")
    Store toEntity(StoreCreateRequest request);

    /**
     * Update Store entity from StoreUpdateRequest
     */
    @Mapping(target = "storeId", ignore = true)
    @Mapping(target = "supplier", ignore = true)
    @Mapping(target = "storeProducts", ignore = true)
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "carts", ignore = true)
    @Mapping(target = "favoritedBy", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "totalReviews", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "street", source = "street")
    @Mapping(target = "ward", source = "ward")
    @Mapping(target = "district", source = "district")
    @Mapping(target = "province", source = "province")
    void updateEntity(@MappingTarget Store store, StoreUpdateRequest request);

    /**
     * Custom enum converter for StoreStatus
     */
    @Named("storeStatusToString")
    default String storeStatusToString(StoreStatus status) {
        return status != null ? status.name() : null;
    }
}
