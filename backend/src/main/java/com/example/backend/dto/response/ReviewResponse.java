package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private String reviewId;
    private String customerId;
    private String customerName;
    private String productId;
    private String productName;
    private String storeId;
    private String storeName;
    private String orderDetailId;
    private String orderCode;
    private int rating;
    private String comment;
    private String imageUrl;        // Review image uploaded by customer
    private boolean markedAsSpam;
    private LocalDateTime createdAt;
    
    // Additional info
    private String productImage;
    private boolean canEdit;        // Customer can edit within X days
    private boolean canDelete;      // Customer can delete
}
