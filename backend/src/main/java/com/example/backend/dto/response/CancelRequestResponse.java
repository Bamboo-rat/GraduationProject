package com.example.backend.dto.response;

import com.example.backend.entity.enums.CancelRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelRequestResponse {

    private String cancelRequestId;
    private String orderId;
    private String orderCode;
    private String customerId;
    private String customerName;
    private String storeId;
    private String storeName;
    private String reason;
    private CancelRequestStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
    private String reviewedByName;
    private String reviewNote;
    
    // Order details
    private String orderStatus;
    private String totalAmount;
}
