package com.example.backend.mapper;

import com.example.backend.dto.response.StorePendingUpdateResponse;
import com.example.backend.dto.response.SupplierPendingUpdateResponse;
import com.example.backend.entity.PendingUpdate;
import com.example.backend.entity.enums.UpdateEntityType;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PendingUpdateMapper {

    /**
     * Convert Store pending update to response
     */
    @Mapping(target = "updateId", source = "updateId")
    @Mapping(target = "storeId", source = "store.storeId")
    @Mapping(target = "currentStoreName", source = "store.storeName")
    @Mapping(target = "storeName", source = "storeName")
    @Mapping(target = "address", source = "address")
    @Mapping(target = "street", source = "street")
    @Mapping(target = "ward", source = "ward")
    @Mapping(target = "district", source = "district")
    @Mapping(target = "province", source = "province")
    @Mapping(target = "phoneNumber", source = "phoneNumber")
    @Mapping(target = "description", source = "description")
    @Mapping(target = "latitude", source = "latitude")
    @Mapping(target = "longitude", source = "longitude")
    @Mapping(target = "imageUrl", source = "imageUrl")
    @Mapping(target = "openTime", source = "openTime")
    @Mapping(target = "closeTime", source = "closeTime")
    @Mapping(target = "status", source = "storeStatus")
    @Mapping(target = "updateStatus", source = "updateStatus")
    @Mapping(target = "adminNotes", source = "adminNotes")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "processedAt", source = "processedAt")
    @Mapping(target = "adminId", source = "admin.userId")
    @Mapping(target = "adminName", source = "admin.fullName")
    StorePendingUpdateResponse toStoreResponse(PendingUpdate pendingUpdate);

    /**
     * Convert Supplier pending update to response
     */
    @Mapping(target = "updateId", source = "updateId")
    @Mapping(target = "supplierId", source = "supplier.userId")
    @Mapping(target = "supplierName", source = "supplier.fullName")
    @Mapping(target = "currentBusinessName", source = "supplier.businessName")
    @Mapping(target = "currentTaxCode", source = "supplier.taxCode")
    @Mapping(target = "currentBusinessLicense", source = "supplier.businessLicense")
    @Mapping(target = "currentFoodSafetyCertificate", source = "supplier.foodSafetyCertificate")
    @Mapping(target = "taxCode", source = "taxCode")
    @Mapping(target = "businessLicense", source = "businessLicense")
    @Mapping(target = "businessLicenseUrl", source = "businessLicenseUrl")
    @Mapping(target = "foodSafetyCertificate", source = "foodSafetyCertificate")
    @Mapping(target = "foodSafetyCertificateUrl", source = "foodSafetyCertificateUrl")
    @Mapping(target = "supplierNotes", source = "supplierNotes")
    @Mapping(target = "updateStatus", source = "updateStatus")
    @Mapping(target = "adminNotes", source = "adminNotes")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "processedAt", source = "processedAt")
    @Mapping(target = "adminId", source = "admin.userId")
    @Mapping(target = "adminName", source = "admin.fullName")
    SupplierPendingUpdateResponse toSupplierResponse(PendingUpdate pendingUpdate);

    /**
     * Generic conversion based on entity type
     */
    default Object toResponse(PendingUpdate pendingUpdate) {
        if (pendingUpdate.getEntityType() == UpdateEntityType.STORE) {
            return toStoreResponse(pendingUpdate);
        } else if (pendingUpdate.getEntityType() == UpdateEntityType.SUPPLIER) {
            return toSupplierResponse(pendingUpdate);
        }
        throw new IllegalArgumentException("Unknown entity type: " + pendingUpdate.getEntityType());
    }
}
