package com.example.backend.entity.enums;

/**
 * Status of a promotion validation attempt
 */
public enum PromotionValidationStatus {
    /**
     * Validation succeeded - promotion is valid and can be applied
     */
    VALID,

    /**
     * Validation failed - promotion code not found
     */
    NOT_FOUND,

    /**
     * Validation failed - promotion expired or inactive
     */
    EXPIRED,

    /**
     * Validation failed - customer doesn't meet tier requirements
     */
    TIER_NOT_MET,

    /**
     * Validation failed - order amount below minimum
     */
    MINIMUM_NOT_MET,

    /**
     * Validation failed - promotion usage limit reached
     */
    LIMIT_REACHED,

    /**
     * Validation failed - customer already used this promotion
     */
    ALREADY_USED,

    /**
     * Validation failed - other error
     */
    ERROR
}
