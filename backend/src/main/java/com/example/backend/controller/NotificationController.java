package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.entity.PendingNotification;
import com.example.backend.entity.enums.NotificationStatus;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for admin to view and manage failed email notifications
 */
@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get all failed notifications
     * Endpoint: GET /api/admin/notifications/failed
     */
    @GetMapping("/failed")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<List<PendingNotification>>> getFailedNotifications() {
        log.info("Admin viewing failed notifications");

        List<PendingNotification> failedNotifications =
                notificationService.getNotificationsByStatus(NotificationStatus.FAILED);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Failed notifications retrieved successfully",
                        failedNotifications
                )
        );
    }

    /**
     * Get all pending notifications
     * Endpoint: GET /api/admin/notifications/pending
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<List<PendingNotification>>> getPendingNotifications() {
        log.info("Admin viewing pending notifications");

        List<PendingNotification> pendingNotifications =
                notificationService.getNotificationsByStatus(NotificationStatus.PENDING);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Pending notifications retrieved successfully",
                        pendingNotifications
                )
        );
    }

    /**
     * Get notification statistics
     * Endpoint: GET /api/admin/notifications/stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getNotificationStats() {
        log.info("Admin viewing notification statistics");

        Map<String, Long> stats = new HashMap<>();
        stats.put("pending", notificationService.countNotificationsByStatus(NotificationStatus.PENDING));
        stats.put("sent", notificationService.countNotificationsByStatus(NotificationStatus.SENT));
        stats.put("failed", notificationService.countNotificationsByStatus(NotificationStatus.FAILED));
        stats.put("processing", notificationService.countNotificationsByStatus(NotificationStatus.PROCESSING));

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Notification statistics retrieved successfully",
                        stats
                )
        );
    }

    /**
     * Manually retry a failed notification
     * Endpoint: POST /api/admin/notifications/{notificationId}/retry
     */
    @PostMapping("/{notificationId}/retry")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    public ResponseEntity<ApiResponse<String>> retryNotification(@PathVariable String notificationId) {
        log.info("Admin manually retrying notification: {}", notificationId);

        boolean success = notificationService.retryNotification(notificationId);

        if (success) {
            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Notification sent successfully",
                            "The notification has been sent successfully"
                    )
            );
        } else {
            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Retry attempt recorded",
                            "The notification retry was attempted but may have failed. Check status for details."
                    )
            );
        }
    }

    /**
     * Process all pending notifications manually
     * Endpoint: POST /api/admin/notifications/process
     */
    @PostMapping("/process")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> processPendingNotifications() {
        log.info("Admin manually triggering notification processing");

        int processedCount = notificationService.processPendingNotifications();

        Map<String, Integer> result = new HashMap<>();
        result.put("processedCount", processedCount);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Notification processing completed",
                        result
                )
        );
    }
}
