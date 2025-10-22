package com.example.backend.service;

import com.example.backend.entity.PendingNotification;
import com.example.backend.entity.enums.EmailNotificationType;
import com.example.backend.entity.enums.NotificationStatus;

import java.util.List;

/**
 * Service for managing email notification queue with retry mechanism
 */
public interface NotificationService {

    /**
     * Queue an email notification for sending
     *
     * @param type Type of notification
     * @param recipientEmail Email address of recipient
     * @param subject Email subject
     * @param content Email content (HTML or plain text)
     * @param relatedEntityId Optional ID of related entity (e.g., supplierId, orderId)
     * @return Created notification entity
     */
    PendingNotification queueNotification(
            EmailNotificationType type,
            String recipientEmail,
            String subject,
            String content,
            String relatedEntityId
    );

    /**
     * Process pending notifications that are ready to be sent
     * Called by scheduled job
     *
     * @return Number of notifications processed successfully
     */
    int processPendingNotifications();

    /**
     * Retry a specific failed notification
     *
     * @param notificationId ID of notification to retry
     * @return true if retry was successful
     */
    boolean retryNotification(String notificationId);

    /**
     * Get all notifications by status
     *
     * @param status Notification status
     * @return List of notifications
     */
    List<PendingNotification> getNotificationsByStatus(NotificationStatus status);

    /**
     * Get count of notifications by status
     *
     * @param status Notification status
     * @return Count of notifications
     */
    long countNotificationsByStatus(NotificationStatus status);

    /**
     * Mark a notification as failed after max retries
     *
     * @param notificationId ID of notification
     * @param errorMessage Error message to store
     */
    void markAsFailed(String notificationId, String errorMessage);

    /**
     * Delete old sent notifications (cleanup)
     *
     * @param daysOld Delete notifications sent more than this many days ago
     */
    void cleanupOldNotifications(int daysOld);
}
