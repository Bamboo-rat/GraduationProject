package com.example.backend.mapper;

import com.example.backend.dto.response.CategorySuggestionResponse;
import com.example.backend.entity.CategorySuggestion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CategorySuggestionMapper {

    @Mapping(target = "supplierId", source = "supplier.userId")
    @Mapping(target = "supplierName", source = "supplier.fullName")
    @Mapping(target = "supplierBusinessName", source = "supplier.businessName")
    @Mapping(target = "adminId", source = "admin.userId")
    @Mapping(target = "adminName", source = "admin.fullName")
    CategorySuggestionResponse toResponse(CategorySuggestion suggestion);
}
