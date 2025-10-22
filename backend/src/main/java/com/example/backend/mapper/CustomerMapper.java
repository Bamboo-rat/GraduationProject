package com.example.backend.mapper;

import com.example.backend.dto.response.CustomerResponse;
import com.example.backend.entity.Customer;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.CustomerTier;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

/**
 * MapStruct Mapper for Customer entity to DTO conversion
 */
@Mapper(componentModel = "spring")
public interface CustomerMapper {

    /**
     * Convert Customer entity to CustomerResponse DTO
     */
    @Mapping(target = "status", source = "status", qualifiedByName = "customerStatusToString")
    @Mapping(target = "tier", source = "tier", qualifiedByName = "customerTierToString")
    @Mapping(target = "totalOrders", expression = "java(customer.getOrders() != null ? customer.getOrders().size() : 0)")
    @Mapping(target = "totalReviews", expression = "java(customer.getReviews() != null ? customer.getReviews().size() : 0)")
    @Mapping(target = "addressCount", expression = "java(customer.getAddresses() != null ? customer.getAddresses().size() : 0)")
    CustomerResponse toResponse(Customer customer);

    /**
     * Convert list of Customer entities to list of CustomerResponse DTOs
     */
    List<CustomerResponse> toResponseList(List<Customer> customers);

    // Custom enum converters
    @Named("customerStatusToString")
    default String customerStatusToString(CustomerStatus status) {
        return status != null ? status.name() : null;
    }

    @Named("customerTierToString")
    default String customerTierToString(CustomerTier tier) {
        return tier != null ? tier.name() : null;
    }
}
