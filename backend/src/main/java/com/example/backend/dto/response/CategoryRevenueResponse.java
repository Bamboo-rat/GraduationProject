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
public class CategoryRevenueResponse {

    private String categoryId;
    private String categoryName;
    private BigDecimal revenue;
    private Long orderCount;
    private Long productCount;
    private Double revenuePercentage; // Percentage of total revenue
}
