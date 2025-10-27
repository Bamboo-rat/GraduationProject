package com.example.backend.dto.response;

import com.example.backend.entity.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for in-app notifications
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String notificationId;
    private String content;
    private NotificationType type;
    private String typeDisplayName;
    private String linkUrl;
    private boolean isRead;
    private boolean isBroadcast;
    private LocalDateTime createdAt;
}
