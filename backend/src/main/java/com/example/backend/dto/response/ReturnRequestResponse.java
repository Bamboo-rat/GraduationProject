package com.example.backend.dto.response;

import com.example.backend.enums.ReturnReason;
import com.example.backend.enums.ReturnRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequestResponse {

    private String id;
    private String orderId;
    private String orderCode;
    private String customerId;
    private String customerName;
    private String storeId;
    private String storeName;
    private ReturnReason reason;
    private String reasonDescription;
    private String description;
    private List<String> imageUrls;
    private ReturnRequestStatus status;
    private String statusDescription;
    private String reviewerId;
    private String reviewerName;
    private String reviewNote;
    private LocalDateTime reviewedAt;
    private Double refundAmount;
    private Double orderTotalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
