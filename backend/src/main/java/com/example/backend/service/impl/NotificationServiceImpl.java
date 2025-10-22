package com.example.backend.service.impl;

import com.example.backend.entity.PendingNotification;
import com.example.backend.entity.enums.EmailNotificationType;
import com.example.backend.entity.enums.NotificationStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.repository.PendingNotificationRepository;
import com.example.backend.service.EmailService;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final PendingNotificationRepository notificationRepository;
    private final EmailService emailService;

    private static final int MAX_RETRIES = 3;
    private static final int BASE_DELAY_MINUTES = 5; // Exponential backoff base

    @Override
    @Transactional
    public PendingNotification queueNotification(
            EmailNotificationType type,
            String recipientEmail,
            String subject,
            String content,
            String relatedEntityId) {

        PendingNotification notification = PendingNotification.builder()
                .type(type)
                .recipientEmail(recipientEmail)
                .subject(subject)
                .content(content)
                .status(NotificationStatus.PENDING)
                .retryCount(0)
                .maxRetries(MAX_RETRIES)
                .relatedEntityId(relatedEntityId)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Queued notification: type={}, recipient={}, id={}",
                type, recipientEmail, notification.getNotificationId());

        // Try to send immediately
        sendNotification(notification);

        return notification;
    }

    @Override
    @Transactional
    public int processPendingNotifications() {
        List<PendingNotification> pendingNotifications =
                notificationRepository.findPendingNotificationsReadyToSend(LocalDateTime.now());

        log.info("Processing {} pending notifications", pendingNotifications.size());

        int successCount = 0;
        for (PendingNotification notification : pendingNotifications) {
            if (sendNotification(notification)) {
                successCount++;
            }
        }

        log.info("Successfully processed {}/{} notifications", successCount, pendingNotifications.size());
        return successCount;
    }

    @Override
    @Transactional
    public boolean retryNotification(String notificationId) {
        PendingNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        if (notification.getStatus() == NotificationStatus.SENT) {
            log.warn("Notification {} already sent", notificationId);
            return true;
        }

        log.info("Manual retry for notification {}", notificationId);
        return sendNotification(notification);
    }

    @Override
    public List<PendingNotification> getNotificationsByStatus(NotificationStatus status) {
        return notificationRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Override
    public long countNotificationsByStatus(NotificationStatus status) {
        return notificationRepository.countByStatus(status);
    }

    @Override
    @Transactional
    public void markAsFailed(String notificationId, String errorMessage) {
        PendingNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.RESOURCE_NOT_FOUND));

        notification.setStatus(NotificationStatus.FAILED);
        notification.setErrorMessage(errorMessage);
        notificationRepository.save(notification);

        log.error("Notification {} marked as FAILED: {}", notificationId, errorMessage);
    }

    @Override
    @Transactional
    public void cleanupOldNotifications(int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        notificationRepository.deleteOldSentNotifications(cutoffDate);
        log.info("Cleaned up old notifications sent before {}", cutoffDate);
    }

    /**
     * Send a notification and update its status
     *
     * @param notification Notification to send
     * @return true if successful, false otherwise
     */
    private boolean sendNotification(PendingNotification notification) {
        // Mark as PROCESSING to prevent duplicate sends
        notification.setStatus(NotificationStatus.PROCESSING);
        notification.setLastAttemptAt(LocalDateTime.now());
        notificationRepository.save(notification);

        try {
            // Attempt to send email
            emailService.sendEmail(
                    notification.getRecipientEmail(),
                    notification.getSubject(),
                    notification.getContent()
            );

            // Success - mark as SENT
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            notificationRepository.save(notification);

            log.info("Successfully sent notification: id={}, type={}, recipient={}",
                    notification.getNotificationId(),
                    notification.getType(),
                    notification.getRecipientEmail());

            return true;

        } catch (Exception e) {
            // Failed - increment retry count and schedule retry
            int newRetryCount = notification.getRetryCount() + 1;
            notification.setRetryCount(newRetryCount);
            notification.setErrorMessage(e.getMessage());

            if (newRetryCount >= notification.getMaxRetries()) {
                // Max retries reached - mark as FAILED
                notification.setStatus(NotificationStatus.FAILED);
                log.error("Notification {} FAILED after {} attempts: {}",
                        notification.getNotificationId(), newRetryCount, e.getMessage());
            } else {
                // Schedule retry with exponential backoff
                int delayMinutes = calculateExponentialBackoff(newRetryCount);
                notification.setNextRetryAt(LocalDateTime.now().plusMinutes(delayMinutes));
                notification.setStatus(NotificationStatus.PENDING);

                log.warn("Notification {} failed (attempt {}/{}). Retry scheduled in {} minutes: {}",
                        notification.getNotificationId(),
                        newRetryCount,
                        notification.getMaxRetries(),
                        delayMinutes,
                        e.getMessage());
            }

            notificationRepository.save(notification);
            return false;
        }
    }

    /**
     * Calculate exponential backoff delay in minutes
     *
     * @param retryCount Current retry count
     * @return Delay in minutes (5, 15, 45 minutes for retries 1, 2, 3)
     */
    private int calculateExponentialBackoff(int retryCount) {
        // Exponential backoff: 5 * (3^(retryCount-1))
        // Retry 1: 5 minutes
        // Retry 2: 15 minutes
        // Retry 3: 45 minutes
        return BASE_DELAY_MINUTES * (int) Math.pow(3, retryCount - 1);
    }
}
