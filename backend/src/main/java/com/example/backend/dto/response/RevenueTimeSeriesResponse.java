package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueTimeSeriesResponse {
    private LocalDate date;
    private Long orderCount;
    private BigDecimal revenue;
    private BigDecimal platformCommission;
    private BigDecimal averageOrderValue;
    private Long newCustomers;
    private Long returningCustomers;
}
