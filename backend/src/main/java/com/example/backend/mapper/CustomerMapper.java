package com.example.backend.mapper;

import com.example.backend.dto.response.CustomerResponse;
import com.example.backend.entity.Customer;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for Customer entity to DTO conversion
 */
@Component
public class CustomerMapper {

    /**
     * Convert Customer entity to CustomerResponse DTO
     */
    public CustomerResponse toResponse(Customer customer) {
        if (customer == null) {
            return null;
        }

        return CustomerResponse.builder()
                .userId(customer.getUserId())
                .keycloakId(customer.getKeycloakId())
                .username(customer.getUsername())
                .email(customer.getEmail())
                .phoneNumber(customer.getPhoneNumber())
                .fullName(customer.getFullName())
                .active(customer.isActive())
                .points(customer.getPoints())
                .lifetimePoints(customer.getLifetimePoints())
                .pointsThisYear(customer.getPointsThisYear())
                .avatarUrl(customer.getAvatarUrl())
                .dateOfBirth(customer.getDateOfBirth())
                .status(customer.getStatus() != null ? customer.getStatus().name() : null)
                .tier(customer.getTier() != null ? customer.getTier().name() : null)
                .tierUpdatedAt(customer.getTierUpdatedAt())
                .totalOrders(customer.getOrders() != null ? customer.getOrders().size() : 0)
                .totalReviews(customer.getReviews() != null ? customer.getReviews().size() : 0)
                .addressCount(customer.getAddresses() != null ? customer.getAddresses().size() : 0)
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }

    /**
     * Convert list of Customer entities to list of CustomerResponse DTOs
     */
    public List<CustomerResponse> toResponseList(List<Customer> customers) {
        if (customers == null) {
            return List.of();
        }
        return customers.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
