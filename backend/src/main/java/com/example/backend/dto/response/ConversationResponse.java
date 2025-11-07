package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {
    private UserInfoResponse otherUser;
    private ChatMessageResponse lastMessage;
    private LocalDateTime lastMessageTime;
    private Long unreadCount;
}
