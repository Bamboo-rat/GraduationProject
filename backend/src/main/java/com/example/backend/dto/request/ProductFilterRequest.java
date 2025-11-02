package com.example.backend.dto.request;

import com.example.backend.entity.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Comprehensive filter request for product search with shopping features
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequest {

    // Basic filters
    private ProductStatus status;
    private String categoryId;
    private String supplierId;

    // Search by keyword
    private String search; // Search in product name and description

    // Price range filters (applied to variant prices)
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    // Expiry date filters
    private LocalDate expiryDateFrom; // Products expiring from this date
    private LocalDate expiryDateTo;   // Products expiring until this date
    private Integer expiringWithinDays; // e.g., 7 for products expiring within next 7 days

    // Location/Distance filters
    private Double userLatitude;
    private Double userLongitude;
    private Double maxDistanceKm; // Maximum distance from user location in kilometers

    // Location text filters
    private String province; // Filter by province/city
    private String district; // Filter by district
    private String ward;     // Filter by ward

    // Sorting options (handled by Pageable, but can specify preference)
    // Sort by: name, price, expiryDate, distance, rating, createdAt
}
