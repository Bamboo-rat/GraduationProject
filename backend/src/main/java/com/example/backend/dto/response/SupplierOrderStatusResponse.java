package com.example.backend.dto.response;

import com.example.backend.entity.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for supplier order status distribution
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierOrderStatusResponse {
    private OrderStatus status;
    private String name;
    private Long count;
    private String color;
}
