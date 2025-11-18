package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for supplier revenue time series data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRevenueTimeSeriesResponse {
    private LocalDate date;
    private BigDecimal revenue;
    private Long orders;
    private BigDecimal averageOrderValue;
}
