package com.example.backend.entity;

import com.example.backend.entity.enums.NotificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @UuidGenerator
    private String notificationId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private NotificationType type;

    private String linkUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Thêm một trường để biết đây là thông báo chung hay riêng
    private boolean isBroadcast = false;

}
