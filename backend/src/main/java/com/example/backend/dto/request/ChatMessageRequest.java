package com.example.backend.dto.request;

import com.example.backend.entity.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {

    @NotBlank(message = "Message content is required")
    private String content;

    @NotBlank(message = "Receiver ID is required")
    private String receiverId;
    
    private String storeId;

    private MessageType type = MessageType.TEXT;

    // Optional metadata for file/image URLs
    private String fileUrl; // Cloudinary URL for images or files
}
