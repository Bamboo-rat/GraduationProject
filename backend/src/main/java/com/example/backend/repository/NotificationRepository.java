package com.example.backend.repository;

import com.example.backend.entity.Notification;
import com.example.backend.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    /**
     * Find all broadcast notifications (sent to all users)
     * @param pageable Pagination
     * @return Page of broadcast notifications
     */
    Page<Notification> findByIsBroadcastTrue(Pageable pageable);

    /**
     * Find broadcast notifications by type
     * @param type Notification type
     * @param pageable Pagination
     * @return Page of notifications
     */
    Page<Notification> findByIsBroadcastTrueAndType(NotificationType type, Pageable pageable);

    /**
     * Find notifications created after a specific date
     * @param createdAt Start date
     * @return List of notifications
     */
    List<Notification> findByCreatedAtAfter(LocalDateTime createdAt);

    /**
     * Delete old notifications created before a specific date
     * @param createdBefore Delete notifications created before this date
     */
    void deleteByCreatedAtBefore(LocalDateTime createdBefore);
}
