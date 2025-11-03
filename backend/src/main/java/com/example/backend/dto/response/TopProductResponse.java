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
public class TopProductResponse {

    private String productId;
    private String productName;
    private String categoryName;
    private String supplierName;
    private Long totalSold;
    private BigDecimal revenue;
    private String imageUrl;
}
