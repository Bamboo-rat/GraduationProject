package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum SuggestionStatus {
    PENDING("Chờ duyệt", "The proposal is awaiting administrator review."),
    APPROVED("Đã duyệt", "The proposal was approved and a new category was created."),
    REJECTED("Bị từ chối", "The proposal was rejected.");

    private final String vietnameseName;
    private final String description;

    SuggestionStatus(String vietnameseName, String description) {
        this.vietnameseName = vietnameseName;
        this.description = description;
    }
}
