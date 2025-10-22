package com.example.backend.entity.enums;

/**
 * Status of pending notifications in the queue
 */
public enum NotificationStatus {
    /**
     * Notification is waiting to be sent
     */
    PENDING,

    /**
     * Notification has been successfully sent
     */
    SENT,

    /**
     * Notification failed after all retry attempts
     */
    FAILED,

    /**
     * Notification is currently being processed
     */
    PROCESSING
}
