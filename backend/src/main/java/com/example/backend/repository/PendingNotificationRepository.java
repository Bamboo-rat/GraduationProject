package com.example.backend.repository;

import com.example.backend.entity.PendingNotification;
import com.example.backend.entity.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PendingNotificationRepository extends JpaRepository<PendingNotification, String> {

    /**
     * Find all notifications with PENDING status that are ready to be sent
     * (nextRetryAt is null or in the past)
     */
    @Query("SELECT pn FROM PendingNotification pn " +
           "WHERE pn.status = 'PENDING' " +
           "AND (pn.nextRetryAt IS NULL OR pn.nextRetryAt <= :now)")
    List<PendingNotification> findPendingNotificationsReadyToSend(@Param("now") LocalDateTime now);

    /**
     * Find all FAILED notifications for admin review
     */
    List<PendingNotification> findByStatusOrderByCreatedAtDesc(NotificationStatus status);

    /**
     * Find notifications by status with pagination support
     */
    @Query("SELECT pn FROM PendingNotification pn " +
           "WHERE pn.status = :status " +
           "ORDER BY pn.createdAt DESC")
    List<PendingNotification> findByStatusPaginated(@Param("status") NotificationStatus status);

    /**
     * Count notifications by status
     */
    long countByStatus(NotificationStatus status);

    /**
     * Find notifications by related entity ID
     */
    List<PendingNotification> findByRelatedEntityId(String relatedEntityId);

    /**
     * Delete old SENT notifications (cleanup)
     */
    @Query("DELETE FROM PendingNotification pn " +
           "WHERE pn.status = 'SENT' " +
           "AND pn.sentAt < :cutoffDate")
    void deleteOldSentNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
}
