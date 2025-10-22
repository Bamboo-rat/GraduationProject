package com.example.backend.dto.response;

import com.example.backend.entity.enums.SuggestionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private String phoneNumber;
    private String description;
    private String latitude;
    private String longitude;
    private String imageUrl;
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
