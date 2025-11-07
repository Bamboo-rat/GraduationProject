package com.example.backend.dto.response;

import com.example.backend.entity.enums.MessageStatus;
import com.example.backend.entity.enums.MessageType;
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
public class ChatMessageResponse {
    private String messageId;
    private String content;
    private LocalDateTime sendTime;
    private UserInfoResponse sender;
    private UserInfoResponse receiver;
    private MessageStatus status;
    private MessageType type;
    private String fileUrl; // Optional: for IMAGE/FILE types
}
