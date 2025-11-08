package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueByCategoryResponse {
    private String categoryId;
    private String categoryName;
    private String categoryImageUrl;
    private Long totalOrders;
    private Long totalProductsSold;
    private BigDecimal totalRevenue;
    private Double revenuePercentage;
    private BigDecimal averageOrderValue;
}
