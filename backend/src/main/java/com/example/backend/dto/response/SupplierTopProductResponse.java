package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for supplier top selling products
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierTopProductResponse {
    private String productId;
    private String productName;
    private String categoryName;
    private Long totalSold;
    private BigDecimal totalRevenue;
    private String imageUrl;
}
