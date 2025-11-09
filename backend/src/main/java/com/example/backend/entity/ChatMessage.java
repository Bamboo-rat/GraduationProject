package com.example.backend.entity;

import com.example.backend.entity.enums.MessageStatus;
import com.example.backend.entity.enums.MessageType;
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
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @UuidGenerator
    private String messageId;

    private String content;

    @CreationTimestamp
    private LocalDateTime sendTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = true)
    private Store store;

    @Enumerated(EnumType.STRING)
    private MessageStatus status = MessageStatus.SENT;

    @Enumerated(EnumType.STRING)
    private MessageType type = MessageType.TEXT;

    @Column(length = 500)
    private String fileUrl;
}
