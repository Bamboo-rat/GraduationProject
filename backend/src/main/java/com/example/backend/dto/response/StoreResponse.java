package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Full store information response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponse {

    private Long storeId;
    
    private String storeName;
    
    private String address;
    
    private String phoneNumber;
    
    private String description;
    
    private Double latitude;
    
    private Double longitude;
    
    private String status;
    
    private Long supplierId;
    
    private String supplierName;
    
    private Integer totalProducts;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
