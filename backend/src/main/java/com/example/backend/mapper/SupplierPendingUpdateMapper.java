package com.example.backend.mapper;

import com.example.backend.dto.response.SupplierPendingUpdateResponse;
import com.example.backend.entity.SupplierPendingUpdate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct Mapper for SupplierPendingUpdate entity
 */
@Mapper(componentModel = "spring")
public interface SupplierPendingUpdateMapper {
    
    @Mapping(target = "supplierId", source = "supplier.userId")
    @Mapping(target = "supplierName", source = "supplier.fullName")
    @Mapping(target = "currentBusinessName", source = "supplier.businessName")
    @Mapping(target = "currentTaxCode", source = "supplier.taxCode")
    @Mapping(target = "currentBusinessLicense", source = "supplier.businessLicense")
    @Mapping(target = "currentFoodSafetyCertificate", source = "supplier.foodSafetyCertificate")
    @Mapping(target = "adminId", source = "admin.userId")
    @Mapping(target = "adminName", source = "admin.fullName")
    SupplierPendingUpdateResponse toResponse(SupplierPendingUpdate update);
}
