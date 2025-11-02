package com.example.backend.entity.enums;

/**
 * Types of email notifications that can be queued
 */
public enum EmailNotificationType {
    /**
     * Supplier approval notification
     */
    SUPPLIER_APPROVAL,

    /**
     * Supplier rejection notification
     */
    SUPPLIER_REJECTION,

    /**
     * Account suspended notification
     */
    ACCOUNT_SUSPENDED,

    /**
     * Account activated notification
     */
    ACCOUNT_ACTIVATED,

    /**
     * Order confirmation notification
     */
    ORDER_CONFIRMATION,

    /**
     * Password reset notification
     */
    PASSWORD_RESET,

    /**
     * Email verification notification
     */
    EMAIL_VERIFICATION,

    /**
     * Welcome email notification
     */
    WELCOME_EMAIL,

    /**
     * Generic email notification
     */
    GENERAL_EMAIL
}
