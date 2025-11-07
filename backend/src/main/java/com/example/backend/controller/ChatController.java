package com.example.backend.controller;

import com.example.backend.dto.request.ChatMessageRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.ChatMessageResponse;
import com.example.backend.dto.response.ConversationResponse;
import com.example.backend.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for chat messaging functionality
 * Supports communication between:
 * - Customer ↔ Supplier
 * - Customer ↔ Admin
 * - Supplier ↔ Admin
 */
@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Chat messaging endpoints for customers, suppliers, and admins")
@SecurityRequirement(name = "Bearer Authentication")
public class ChatController {

    private final ChatService chatService;

    /**
     * Get user ID from JWT authentication
     */
    private String getUserIdFromAuth(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return jwt.getSubject();
    }

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Send a message",
               description = "Send a new chat message to another user")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            Authentication authentication,
            @Valid @RequestBody ChatMessageRequest request) {
        String senderId = getUserIdFromAuth(authentication);
        log.info("POST /api/chat/send - User {} sending message to {}", senderId, request.getReceiverId());

        ChatMessageResponse response = chatService.sendMessage(senderId, request);
        return ResponseEntity.ok(ApiResponse.success("Message sent successfully", response));
    }

    @GetMapping("/conversations")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get all conversations",
               description = "Get list of all conversations with last message and unread count")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
            Authentication authentication) {
        String userId = getUserIdFromAuth(authentication);
        log.info("GET /api/chat/conversations - Getting conversations for user {}", userId);

        List<ConversationResponse> conversations = chatService.getConversations(userId);
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/conversations/{otherUserId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get conversation history",
               description = "Get paginated conversation history with another user (newest first)")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getConversation(
            Authentication authentication,
            @PathVariable String otherUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String userId = getUserIdFromAuth(authentication);
        log.info("GET /api/chat/conversations/{} - User {} getting conversation (page: {}, size: {})",
                otherUserId, userId, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "sendTime"));
        Page<ChatMessageResponse> messages = chatService.getConversation(userId, otherUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/messages/{messageId}/read")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Mark message as read",
               description = "Mark a specific message as read (receiver only)")
    public ResponseEntity<ApiResponse<Void>> markMessageAsRead(
            Authentication authentication,
            @PathVariable String messageId) {
        String userId = getUserIdFromAuth(authentication);
        log.info("POST /api/chat/messages/{}/read - User {} marking message as read", messageId, userId);

        chatService.markAsRead(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read"));
    }

    @PostMapping("/conversations/{otherUserId}/read")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Mark conversation as read",
               description = "Mark all messages in a conversation as read")
    public ResponseEntity<ApiResponse<Void>> markConversationAsRead(
            Authentication authentication,
            @PathVariable String otherUserId) {
        String userId = getUserIdFromAuth(authentication);
        log.info("POST /api/chat/conversations/{}/read - User {} marking conversation as read",
                otherUserId, userId);

        chatService.markConversationAsRead(userId, otherUserId);
        return ResponseEntity.ok(ApiResponse.success("Conversation marked as read"));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get unread message count",
               description = "Get total number of unread messages for current user")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication authentication) {
        String userId = getUserIdFromAuth(authentication);
        log.info("GET /api/chat/unread-count - Getting unread count for user {}", userId);

        Long unreadCount = chatService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(unreadCount));
    }

    @GetMapping("/messages/{messageId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get message by ID",
               description = "Get a specific message by ID (sender or receiver only)")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> getMessage(
            Authentication authentication,
            @PathVariable String messageId) {
        String userId = getUserIdFromAuth(authentication);
        log.info("GET /api/chat/messages/{} - User {} getting message", messageId, userId);

        ChatMessageResponse message = chatService.getMessage(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @DeleteMapping("/messages/{messageId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Delete message",
               description = "Delete a message (sender only)")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            Authentication authentication,
            @PathVariable String messageId) {
        String userId = getUserIdFromAuth(authentication);
        log.info("DELETE /api/chat/messages/{} - User {} deleting message", messageId, userId);

        chatService.deleteMessage(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully"));
    }
}
