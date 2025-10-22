package com.example.backend.service.impl;

import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Scheduled service for processing pending email notifications
 * with automatic retry mechanism
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduledService {

    private final NotificationService notificationService;

    /**
     * Process pending notifications every 5 minutes
     * Checks for notifications that are ready to be sent or retried
     */
    @Scheduled(fixedRate = 300000) // 5 minutes = 300,000 ms
    public void processPendingNotifications() {
        log.info("Starting scheduled notification processing...");

        try {
            int processedCount = notificationService.processPendingNotifications();
            log.info("Scheduled notification processing completed. Processed: {}", processedCount);
        } catch (Exception e) {
            log.error("Error during scheduled notification processing", e);
        }
    }

    /**
     * Cleanup old sent notifications every day at 2 AM
     * Deletes notifications sent more than 30 days ago
     */
    @Scheduled(cron = "0 0 2 * * *") // 2 AM every day
    public void cleanupOldNotifications() {
        log.info("Starting scheduled notification cleanup...");

        try {
            notificationService.cleanupOldNotifications(30); // 30 days
            log.info("Scheduled notification cleanup completed.");
        } catch (Exception e) {
            log.error("Error during scheduled notification cleanup", e);
        }
    }
}
