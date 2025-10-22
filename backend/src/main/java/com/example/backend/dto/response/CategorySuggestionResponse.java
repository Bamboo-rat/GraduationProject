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
public class CategorySuggestionResponse {

    private String suggestionId;
    private String name;
    private String reason;
    private SuggestionStatus status;
    private String adminNotes;

    // Supplier info (người đề xuất)
    private String supplierId;
    private String supplierName;
    private String supplierBusinessName;

    // Admin info (người xử lý)
    private String adminId;
    private String adminName;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}
