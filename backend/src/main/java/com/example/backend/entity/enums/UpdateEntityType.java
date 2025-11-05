package com.example.backend.entity.enums;

import lombok.Getter;

/**
 * Enum for entity types that can have pending updates
 */
@Getter
public enum UpdateEntityType {
    STORE("Cửa hàng", "Store information update"),
    SUPPLIER("Nhà cung cấp", "Supplier business information update");

    private final String displayName;
    private final String description;

    UpdateEntityType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
