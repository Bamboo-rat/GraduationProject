package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum ViolationSeverity {
    LOW("Thấp", "Low severity violation", 1),
    MEDIUM("Trung bình", "Medium severity violation", 2),
    HIGH("Cao", "High severity violation", 3),
    CRITICAL("Nghiêm trọng", "Critical violation", 4);

    private final String displayName;
    private final String description;
    private final int level;

    ViolationSeverity(String displayName, String description, int level) {
        this.displayName = displayName;
        this.description = description;
        this.level = level;
    }
}
