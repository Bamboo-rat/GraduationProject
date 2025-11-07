package com.example.backend.controller;

import com.example.backend.dto.request.ChatMessageRequest;
import com.example.backend.dto.response.ChatMessageResponse;
import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Controller;

/**
 * WebSocket controller for real-time chat messaging
 * Handles STOMP messages for chat functionality
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handle incoming chat messages via WebSocket
     * Clients send to: /app/chat/send
     * Server broadcasts to: /user/{receiverId}/queue/messages
     *
     * @param request        Chat message request
     * @param authentication Spring Security authentication with JWT
     */
    @MessageMapping("/chat/send")
    public void sendMessage(@Payload ChatMessageRequest request, Authentication authentication) {
        try {
            // Extract sender ID from JWT
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String senderId = jwt.getSubject();

            log.info("WebSocket message received from user {} to user {}", senderId, request.getReceiverId());

            // Save message via service
            ChatMessageResponse savedMessage = chatService.sendMessage(senderId, request);

            // Send message to receiver via WebSocket
            messagingTemplate.convertAndSendToUser(
                    request.getReceiverId(),
                    "/queue/messages",
                    savedMessage
            );

            // Also send confirmation back to sender
            messagingTemplate.convertAndSendToUser(
                    senderId,
                    "/queue/messages",
                    savedMessage
            );

            log.info("Message {} sent successfully via WebSocket to user {}",
                    savedMessage.getMessageId(), request.getReceiverId());

        } catch (Exception e) {
            log.error("Error sending WebSocket message: {}", e.getMessage(), e);

            // Send error message back to sender
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String senderId = jwt.getSubject();

            messagingTemplate.convertAndSendToUser(
                    senderId,
                    "/queue/errors",
                    "Failed to send message: " + e.getMessage()
            );
        }
    }

    /**
     * Handle message read receipts via WebSocket
     * Clients send to: /app/chat/read
     *
     * @param messageId      ID of the message to mark as read
     * @param authentication Spring Security authentication with JWT
     */
    @MessageMapping("/chat/read")
    public void markMessageAsRead(@Payload String messageId, Authentication authentication) {
        try {
            // Extract user ID from JWT
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String userId = jwt.getSubject();

            log.info("WebSocket read receipt for message {} by user {}", messageId, userId);

            // Mark message as read
            chatService.markAsRead(messageId, userId);

            // Get message details to notify sender
            ChatMessageResponse message = chatService.getMessage(messageId, userId);

            // Notify sender that message was read
            messagingTemplate.convertAndSendToUser(
                    message.getSender().getUserId(),
                    "/queue/read-receipts",
                    messageId
            );

            log.info("Read receipt sent for message {}", messageId);

        } catch (Exception e) {
            log.error("Error processing read receipt: {}", e.getMessage(), e);
        }
    }

    /**
     * Handle typing indicators via WebSocket
     * Clients send to: /app/chat/typing
     *
     * @param receiverId     ID of the user to notify about typing
     * @param authentication Spring Security authentication with JWT
     */
    @MessageMapping("/chat/typing")
    public void sendTypingIndicator(@Payload String receiverId, Authentication authentication) {
        try {
            // Extract sender ID from JWT
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String senderId = jwt.getSubject();

            log.debug("Typing indicator from user {} to user {}", senderId, receiverId);

            // Send typing indicator to receiver
            messagingTemplate.convertAndSendToUser(
                    receiverId,
                    "/queue/typing",
                    senderId
            );

        } catch (Exception e) {
            log.error("Error sending typing indicator: {}", e.getMessage(), e);
        }
    }
}
