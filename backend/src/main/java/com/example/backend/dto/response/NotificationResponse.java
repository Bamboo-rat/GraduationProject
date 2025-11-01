package com.example.backend.dto.response;

import com.example.backend.entity.enums.NotificationType;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    /**
     * Whether the notification has been read by the user
     * @JsonProperty ensures Jackson serializes this as "isRead" instead of "read"
     */
    @JsonProperty("isRead")
    private boolean isRead;

    /**
     * Whether this is a broadcast notification sent to all users
     * @JsonProperty ensures Jackson serializes this as "isBroadcast" instead of "broadcast"
     */
    @JsonProperty("isBroadcast")
    private boolean isBroadcast;

    private LocalDateTime createdAt;
}
