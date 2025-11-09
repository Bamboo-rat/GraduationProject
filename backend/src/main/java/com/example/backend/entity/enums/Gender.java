package com.example.backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Gender options for users
 */
public enum Gender {
    MALE,
    FEMALE,
    OTHER;

    @JsonValue
    public String toValue() {
        return this.name();
    }

    @JsonCreator
    public static Gender fromValue(String value) {
        if (value == null) {
            return null;
        }

        try {
            return Gender.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid gender value: " + value + ". Allowed values are: MALE, FEMALE, OTHER (case-insensitive)"
            );
        }
    }
}
