package com.example.backend.service;

import com.example.backend.dto.request.ChatMessageRequest;
import com.example.backend.dto.response.ChatMessageResponse;
import com.example.backend.dto.response.ConversationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for chat messaging functionality
 * Supports communication between:
 * - Customer ↔ Supplier
 * - Customer ↔ Admin
 * - Supplier ↔ Admin
 */
public interface ChatService {

    /**
     * Send a new message from sender to receiver
     *
     * @param senderId ID of the user sending the message
     * @param request  Message request containing content, receiver ID, and type
     * @return ChatMessageResponse with message details
     */
    ChatMessageResponse sendMessage(String senderId, ChatMessageRequest request);

    /**
     * Get conversation history between two users with pagination
     * Messages are ordered by send time descending (newest first)
     *
     * @param userId      ID of the current user
     * @param otherUserId ID of the other user in the conversation
     * @param pageable    Pagination parameters
     * @return Page of ChatMessageResponse objects
     */
    Page<ChatMessageResponse> getConversation(String userId, String otherUserId, Pageable pageable);

    /**
     * Get all conversations for a user with summary information
     * Returns list of conversations with last message and unread count
     *
     * @param userId ID of the current user
     * @return List of ConversationResponse objects
     */
    List<ConversationResponse> getConversations(String userId);

    /**
     * Mark a specific message as read
     *
     * @param messageId ID of the message to mark as read
     * @param userId    ID of the user marking the message (must be receiver)
     */
    void markAsRead(String messageId, String userId);

    /**
     * Mark all messages in a conversation as read
     * Updates all unread messages from senderId to receiverId
     *
     * @param receiverId ID of the user receiving the messages (current user)
     * @param senderId   ID of the user who sent the messages
     */
    void markConversationAsRead(String receiverId, String senderId);

    /**
     * Get total unread message count for a user
     *
     * @param userId ID of the user
     * @return Total number of unread messages
     */
    Long getUnreadCount(String userId);

    /**
     * Get a specific message by ID
     *
     * @param messageId ID of the message
     * @param userId    ID of the requesting user (for authorization)
     * @return ChatMessageResponse with message details
     */
    ChatMessageResponse getMessage(String messageId, String userId);

    /**
     * Delete a message (only sender can delete)
     *
     * @param messageId ID of the message to delete
     * @param userId    ID of the user requesting deletion (must be sender)
     */
    void deleteMessage(String messageId, String userId);
}
