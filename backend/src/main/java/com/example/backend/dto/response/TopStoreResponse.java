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
public class TopStoreResponse {

    private String storeId;
    private String storeName;
    private String supplierName;
    private Long orderCount;
    private BigDecimal revenue;
}
