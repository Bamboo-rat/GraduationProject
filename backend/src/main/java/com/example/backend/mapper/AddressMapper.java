package com.example.backend.mapper;

import com.example.backend.dto.request.AddressRequest;
import com.example.backend.dto.response.AddressResponse;
import com.example.backend.entity.Address;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for Address entity
 */
@Mapper(componentModel = "spring")
public interface AddressMapper {

    /**
     * Convert Address entity to AddressResponse DTO
     */
    AddressResponse toResponse(Address address);

    /**
     * Convert AddressRequest DTO to Address entity
     * Customer will be set separately in service layer
     */
    @Mapping(target = "addressId", ignore = true)
    @Mapping(target = "customer", ignore = true)
    Address toEntity(AddressRequest request);

    /**
     * Update Address entity from AddressRequest DTO
     * Used for update operations
     */
    @Mapping(target = "addressId", ignore = true)
    @Mapping(target = "customer", ignore = true)
    void updateEntityFromRequest(AddressRequest request, @MappingTarget Address address);
}
