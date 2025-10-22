package com.example.backend.mapper;

import com.example.backend.dto.response.StorePendingUpdateResponse;
import com.example.backend.entity.StorePendingUpdate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StorePendingUpdateMapper {

    @Mapping(target = "storeId", source = "store.storeId")
    @Mapping(target = "currentStoreName", source = "store.storeName")
    @Mapping(target = "adminId", source = "admin.userId")
    @Mapping(target = "adminName", source = "admin.fullName")
    StorePendingUpdateResponse toResponse(StorePendingUpdate update);
}
