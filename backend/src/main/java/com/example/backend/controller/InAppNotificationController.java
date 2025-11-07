package com.example.backend.controller;

import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.NotificationResponse;
import com.example.backend.service.InAppNotificationService;
import com.example.backend.util.AuthenticationUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for in-app notifications (notification bar on website)
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "In-App Notifications", description = "In-app notification endpoints for website notification bar")
@SecurityRequirement(name = "Bearer Authentication")
public class InAppNotificationController {

    private final InAppNotificationService notificationService;
    private final AuthenticationUtil authenticationUtil;

    /**
     * Get all notifications for current user
     * GET /api/notifications
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(
            summary = "Get user notifications",
            description = "Get all notifications for the authenticated user with pagination"
    )
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotifications(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "notification.createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        String userId = authenticationUtil.extractUserId(authentication);

        log.info("GET /api/notifications - User {} fetching notifications", userId);

        Page<NotificationResponse> notifications = notificationService.getNotificationsForUser(userId, pageable);

        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", notifications));
    }

    /**
     * Get unread notifications for current user
     * GET /api/notifications/unread
     */
    @GetMapping("/unread")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(
            summary = "Get unread notifications",
            description = "Get only unread notifications for the authenticated user"
    )
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getUnreadNotifications(
            Authentication authentication,
            @PageableDefault(size = 20, sort = "notification.createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        String userId = authenticationUtil.extractUserId(authentication);

        log.info("GET /api/notifications/unread - User {} fetching unread notifications", userId);

        Page<NotificationResponse> notifications = notificationService.getUnreadNotificationsForUser(userId, pageable);

        return ResponseEntity.ok(ApiResponse.success("Unread notifications retrieved successfully", notifications));
    }

    /**
     * Get unread notification count for current user
     * GET /api/notifications/unread-count
     * This is used to display badge count on notification icon in header
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(
            summary = "Get unread notification count",
            description = "Get the count of unread notifications for display on notification badge in header"
    )
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication authentication) {

        String userId = authenticationUtil.extractUserId(authentication);

        log.debug("GET /api/notifications/unread-count - User {}", userId);

        long unreadCount = notificationService.getUnreadCount(userId);

        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", unreadCount);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Mark a notification as read
     * PATCH /api/notifications/{notificationId}/read
     */
    @PatchMapping("/{notificationId}/read")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(
            summary = "Mark notification as read",
            description = "Mark a specific notification as read for the current user"
    )
    public ResponseEntity<ApiResponse<String>> markAsRead(
            @PathVariable String notificationId,
            Authentication authentication) {

        String userId = authenticationUtil.extractUserId(authentication);

        log.info("PATCH /api/notifications/{}/read - User {}", notificationId, userId);

        notificationService.markAsRead(userId, notificationId);

        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }

    /**
     * Mark all notifications as read
     * POST /api/notifications/mark-all-read
     */
    @PostMapping("/mark-all-read")
    @PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF', 'CUSTOMER')")
    @Operation(
            summary = "Mark all notifications as read",
            description = "Mark all notifications as read for the current user"
    )
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllAsRead(Authentication authentication) {

        String userId = authenticationUtil.extractUserId(authentication);

        log.info("POST /api/notifications/mark-all-read - User {}", userId);

        int count = notificationService.markAllAsRead(userId);

        Map<String, Integer> response = new HashMap<>();
        response.put("markedCount", count);

        return ResponseEntity.ok(ApiResponse.success(
                String.format("Marked %d notifications as read", count),
                response
        ));
    }
}
