package com.example.backend.repository;

import com.example.backend.entity.UserNotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserNotificationStatusRepository extends JpaRepository<UserNotificationStatus, String> {

    /**
     * Find all notifications for a user with pagination
     * @param userId User ID
     * @param pageable Pagination
     * @return Page of user notification statuses
     */
    @Query("SELECT uns FROM UserNotificationStatus uns " +
           "JOIN FETCH uns.notification n " +
           "WHERE uns.user.userId = :userId " +
           "ORDER BY n.createdAt DESC")
    Page<UserNotificationStatus> findByUserUserId(@Param("userId") String userId, Pageable pageable);

    /**
     * Find unread notifications for a user
     * @param userId User ID
     * @param pageable Pagination
     * @return Page of unread notifications
     */
    @Query("SELECT uns FROM UserNotificationStatus uns " +
           "JOIN FETCH uns.notification n " +
           "WHERE uns.user.userId = :userId AND uns.isRead = false " +
           "ORDER BY n.createdAt DESC")
    Page<UserNotificationStatus> findUnreadByUserId(@Param("userId") String userId, Pageable pageable);

    /**
     * Count unread notifications for a user
     * @param userId User ID
     * @return Count of unread notifications
     */
    @Query("SELECT COUNT(uns) FROM UserNotificationStatus uns " +
           "WHERE uns.user.userId = :userId AND uns.isRead = false")
    long countUnreadByUserId(@Param("userId") String userId);

    /**
     * Find a specific notification status for a user
     * @param userId User ID
     * @param notificationId Notification ID
     * @return Optional UserNotificationStatus
     */
    @Query("SELECT uns FROM UserNotificationStatus uns " +
           "WHERE uns.user.userId = :userId AND uns.notification.notificationId = :notificationId")
    Optional<UserNotificationStatus> findByUserIdAndNotificationId(
            @Param("userId") String userId,
            @Param("notificationId") String notificationId
    );

    /**
     * Check if a user has already received a notification
     * @param userId User ID
     * @param notificationId Notification ID
     * @return true if exists
     */
    @Query("SELECT COUNT(uns) > 0 FROM UserNotificationStatus uns " +
           "WHERE uns.user.userId = :userId AND uns.notification.notificationId = :notificationId")
    boolean existsByUserIdAndNotificationId(
            @Param("userId") String userId,
            @Param("notificationId") String notificationId
    );

    /**
     * Mark all notifications as read for a user
     * @param userId User ID
     * @return Number of notifications marked as read
     */
    @Modifying
    @Query("UPDATE UserNotificationStatus uns SET uns.isRead = true " +
           "WHERE uns.user.userId = :userId AND uns.isRead = false")
    int markAllAsReadByUserId(@Param("userId") String userId);

    /**
     * Delete notification statuses for a specific notification
     * @param notificationId Notification ID
     */
    void deleteByNotificationNotificationId(String notificationId);
}
