package com.example.backend.service;

import com.example.backend.dto.response.NotificationResponse;
import com.example.backend.entity.enums.NotificationType;
import com.example.backend.entity.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for managing in-app notifications displayed on the website
 */
public interface InAppNotificationService {

    /**
     * Create a notification for specific user
     * @param userId User ID to receive notification
     * @param type Type of notification
     * @param content Notification content
     * @param linkUrl Optional link URL (e.g., to view the related entity)
     * @return Notification ID
     */
    String createNotificationForUser(String userId, NotificationType type, String content, String linkUrl);

    /**
     * Create a notification for all users with specific role(s)
     * @param roles Target roles
     * @param type Type of notification
     * @param content Notification content
     * @param linkUrl Optional link URL
     * @return Notification ID
     */
    String createNotificationForRoles(Role[] roles, NotificationType type, String content, String linkUrl);

    /**
     * Create a broadcast notification for all admins
     * @param type Type of notification
     * @param content Notification content
     * @param linkUrl Optional link URL
     * @return Notification ID
     */
    String createNotificationForAllAdmins(NotificationType type, String content, String linkUrl);

    /**
     * Get all notifications for a user
     * @param keycloakId User's Keycloak ID
     * @param pageable Pagination
     * @return Page of notifications
     */
    Page<NotificationResponse> getNotificationsForUser(String keycloakId, Pageable pageable);

    /**
     * Get unread notifications for a user
     * @param keycloakId User's Keycloak ID
     * @param pageable Pagination
     * @return Page of unread notifications
     */
    Page<NotificationResponse> getUnreadNotificationsForUser(String keycloakId, Pageable pageable);

    /**
     * Get count of unread notifications for a user
     * @param keycloakId User's Keycloak ID
     * @return Count of unread notifications
     */
    long getUnreadCount(String keycloakId);

    /**
     * Mark a notification as read
     * @param keycloakId User's Keycloak ID
     * @param notificationId Notification ID
     */
    void markAsRead(String keycloakId, String notificationId);

    /**
     * Mark all notifications as read for a user
     * @param keycloakId User's Keycloak ID
     * @return Number of notifications marked as read
     */
    int markAllAsRead(String keycloakId);

    /**
     * Delete old notifications (cleanup)
     * @param daysOld Delete notifications older than this many days
     */
    void deleteOldNotifications(int daysOld);
}
