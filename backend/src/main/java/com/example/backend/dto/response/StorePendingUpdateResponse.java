package com.example.backend.dto.response;

import com.example.backend.entity.enums.SuggestionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorePendingUpdateResponse {
    
    private String updateId;
    
    // Store info
    private String storeId;
    private String currentStoreName;
    
    // Pending update fields
    private String storeName;
    private String address;
    private String street;
    private String ward;
    private String district;
    private String province;
    private String phoneNumber;
    private String description;
    private Double latitude;
    private Double longitude;
    private String imageUrl;
    private LocalTime openTime;
    private LocalTime closeTime;
    private String status;
    
    // Update metadata
    private SuggestionStatus updateStatus;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
    
    // Admin info (người xử lý)
    private String adminId;
    private String adminName;
}
