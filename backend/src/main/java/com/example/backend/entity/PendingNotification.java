package com.example.backend.entity;

import com.example.backend.entity.enums.EmailNotificationType;
import com.example.backend.entity.enums.NotificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity for queuing email notifications with retry mechanism
 * Ensures failed emails are tracked and can be retried
 */
@Entity
@Table(name = "pending_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notification_id")
    private String notificationId;

    /**
     * Type of email notification
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EmailNotificationType type;

    /**
     * Recipient email address
     */
    @Column(nullable = false, length = 255)
    private String recipientEmail;

    /**
     * Email subject
     */
    @Column(nullable = false, length = 500)
    private String subject;

    /**
     * Email content (HTML or plain text)
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Current status of the notification
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationStatus status;

    /**
     * Number of retry attempts made
     */
    @Column(nullable = false)
    private Integer retryCount = 0;

    /**
     * Maximum number of retry attempts allowed
     */
    @Column(nullable = false)
    private Integer maxRetries = 3;

    /**
     * Last time a send attempt was made
     */
    @Column(name = "last_attempt_at")
    private LocalDateTime lastAttemptAt;

    /**
     * Error message from last failed attempt
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * Next scheduled retry time (for exponential backoff)
     */
    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;

    /**
     * Related entity ID (e.g., supplierId, orderId) for reference
     */
    @Column(name = "related_entity_id")
    private String relatedEntityId;

    /**
     * When the notification was created
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Last update time
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * When the notification was successfully sent
     */
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
