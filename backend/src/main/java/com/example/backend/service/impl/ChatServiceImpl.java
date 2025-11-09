package com.example.backend.service.impl;

import com.example.backend.dto.request.ChatMessageRequest;
import com.example.backend.dto.response.ChatMessageResponse;
import com.example.backend.dto.response.ConversationResponse;
import com.example.backend.dto.response.UserInfoResponse;
import com.example.backend.entity.ChatMessage;
import com.example.backend.entity.Store;
import com.example.backend.entity.User;
import com.example.backend.entity.enums.MessageStatus;
import com.example.backend.exception.ErrorCode;
import com.example.backend.exception.custom.ForbiddenException;
import com.example.backend.exception.custom.NotFoundException;
import com.example.backend.mapper.ChatMessageMapper;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.StoreRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ChatMessageMapper chatMessageMapper;
    private final StoreRepository storeRepository;

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(String senderId, ChatMessageRequest request) {
        log.info("Sending message from user {} to user {}", senderId, request.getReceiverId());

        // Validate sender exists
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                        "Sender not found"));

        User receiver;
        Store store = null;

        // Check if this is a customer-store conversation
        if (request.getStoreId() != null && !request.getStoreId().isEmpty()) {
            // Validate store exists
            store = storeRepository.findById(request.getStoreId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.STORE_NOT_FOUND,
                            "Store not found"));

            // Determine receiver based on who is sending
            String supplierId = store.getSupplier().getUserId();

            if (senderId.equals(supplierId)) {
                // Supplier is sending to customer - use receiverId from request
                receiver = userRepository.findById(request.getReceiverId())
                        .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                                "Receiver (customer) not found"));
                log.info("Supplier-to-customer store conversation: storeId={}, supplierId={}, customerId={}",
                        request.getStoreId(), senderId, receiver.getUserId());
            } else {
                // Customer is sending to supplier - receiver is store owner
                receiver = store.getSupplier();
                log.info("Customer-to-supplier store conversation: storeId={}, customerId={}, supplierId={}",
                        request.getStoreId(), senderId, receiver.getUserId());
            }
        } else {
            // Regular user-to-user conversation (admin-supplier, admin-customer, etc.)
            receiver = userRepository.findById(request.getReceiverId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                            "Receiver not found"));
        }

        // Create chat message entity
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setContent(request.getContent());
        chatMessage.setSender(sender);
        chatMessage.setReceiver(receiver);
        chatMessage.setType(request.getType());
        chatMessage.setStatus(MessageStatus.SENT);

        // Set store context if this is customer-store conversation
        if (store != null) {
            chatMessage.setStore(store);
        }

        // Save message
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        log.info("Message saved with ID: {}", savedMessage.getMessageId());

        // Convert to response DTO
        ChatMessageResponse response = chatMessageMapper.toResponse(savedMessage);

        // Set fileUrl if provided
        if (request.getFileUrl() != null && !request.getFileUrl().isEmpty()) {
            response.setFileUrl(request.getFileUrl());
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getConversation(String userId, String otherUserId, Pageable pageable) {
        log.info("Getting conversation between user {} and user {}", userId, otherUserId);

        // Validate both users exist
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "User not found");
        }
        if (!userRepository.existsById(otherUserId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "Other user not found");
        }

        // Get conversation messages
        Page<ChatMessage> messages = chatMessageRepository.findConversationBetweenUsers(
                userId, otherUserId, pageable);

        // Convert to response DTOs
        return messages.map(chatMessageMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String userId) {
        log.info("Getting all conversations for user {}", userId);

        // Validate user exists
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "User not found");
        }

        // Get all conversation partners
        List<String> partnerIds = chatMessageRepository.findAllConversationPartners(userId);
        log.info("Found {} conversation partners for user {}", partnerIds.size(), userId);

        List<ConversationResponse> conversations = new ArrayList<>();

        for (String partnerId : partnerIds) {
            try {
                // Get partner user info
                User partner = userRepository.findById(partnerId)
                        .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                                "Partner user not found"));

                // Get last message (use PageRequest to get top 1)
                Pageable pageRequest = PageRequest.of(0, 1);
                List<ChatMessage> lastMessages = chatMessageRepository.findLastMessageBetweenUsers(userId, partnerId, pageRequest);
                ChatMessage lastMessage = lastMessages.isEmpty() ? null : lastMessages.get(0);

                if (lastMessage != null) {
                    // Get unread count
                    Long unreadCount = chatMessageRepository.countUnreadMessagesInConversation(userId, partnerId);

                    // Convert to response DTOs
                    UserInfoResponse partnerInfo = chatMessageMapper.userToUserInfoResponse(partner);
                    ChatMessageResponse lastMessageResponse = chatMessageMapper.toResponse(lastMessage);

                    // Build conversation response
                    ConversationResponse conversation = ConversationResponse.builder()
                            .otherUser(partnerInfo)
                            .lastMessage(lastMessageResponse)
                            .lastMessageTime(lastMessage.getSendTime())
                            .unreadCount(unreadCount)
                            .build();

                    conversations.add(conversation);
                }
            } catch (Exception e) {
                log.error("Error processing conversation with partner {}: {}", partnerId, e.getMessage());
                // Continue to next partner
            }
        }

        // Sort by last message time descending (most recent first)
        conversations.sort((c1, c2) -> c2.getLastMessageTime().compareTo(c1.getLastMessageTime()));

        return conversations;
    }

    @Override
    @Transactional
    public void markAsDelivered(String messageId, String userId) {
        log.info("Marking message {} as delivered to user {}", messageId, userId);

        // Get message
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.MESSAGE_NOT_FOUND,
                        "Message not found"));

        // Verify user is the receiver
        if (!message.getReceiver().getUserId().equals(userId)) {
            throw new ForbiddenException(ErrorCode.UNAUTHORIZED_MESSAGE_ACCESS,
                    "You can only mark your own messages as delivered");
        }

        // Only update if current status is SENT (prevent downgrade from READ to DELIVERED)
        if (message.getStatus() == MessageStatus.SENT) {
            message.setStatus(MessageStatus.DELIVERED);
            chatMessageRepository.save(message);
            log.info("Message {} marked as delivered", messageId);
        } else {
            log.debug("Message {} already has status {}, not updating to DELIVERED", 
                    messageId, message.getStatus());
        }
    }

    @Override
    @Transactional
    public void markAsRead(String messageId, String userId) {
        log.info("Marking message {} as read by user {}", messageId, userId);

        // Get message
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.MESSAGE_NOT_FOUND,
                        "Message not found"));

        // Verify user is the receiver
        if (!message.getReceiver().getUserId().equals(userId)) {
            throw new ForbiddenException(ErrorCode.UNAUTHORIZED_MESSAGE_ACCESS,
                    "You can only mark your own messages as read");
        }

        // Update status to READ (can upgrade from both SENT and DELIVERED)
        message.setStatus(MessageStatus.READ);
        chatMessageRepository.save(message);

        log.info("Message {} marked as read", messageId);
    }

    @Override
    @Transactional
    public void markConversationAsRead(String receiverId, String senderId) {
        log.info("Marking conversation as read: receiver={}, sender={}", receiverId, senderId);

        // Validate both users exist
        if (!userRepository.existsById(receiverId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "Receiver not found");
        }
        if (!userRepository.existsById(senderId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "Sender not found");
        }

        // Mark all messages as read
        int updatedCount = chatMessageRepository.markConversationAsRead(receiverId, senderId);
        log.info("Marked {} messages as read in conversation", updatedCount);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getUnreadCount(String userId) {
        log.info("Getting unread count for user {}", userId);

        // Validate user exists
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "User not found");
        }

        return chatMessageRepository.countUnreadMessagesByReceiver(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatMessageResponse getMessage(String messageId, String userId) {
        log.info("Getting message {} for user {}", messageId, userId);

        // Get message
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.MESSAGE_NOT_FOUND,
                        "Message not found"));

        // Verify user is sender or receiver
        String senderId = message.getSender().getUserId();
        String receiverId = message.getReceiver().getUserId();

        if (!senderId.equals(userId) && !receiverId.equals(userId)) {
            throw new ForbiddenException(ErrorCode.UNAUTHORIZED_MESSAGE_ACCESS,
                    "You can only view your own messages");
        }

        return chatMessageMapper.toResponse(message);
    }

    @Override
    @Transactional
    public void deleteMessage(String messageId, String userId) {
        log.info("Deleting message {} by user {}", messageId, userId);

        // Get message
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.MESSAGE_NOT_FOUND,
                        "Message not found"));

        // Verify user is the sender
        if (!message.getSender().getUserId().equals(userId)) {
            throw new ForbiddenException(ErrorCode.CANNOT_DELETE_MESSAGE,
                    "You can only delete your own messages");
        }

        // Delete message
        chatMessageRepository.delete(message);
        log.info("Message {} deleted successfully", messageId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getStoreConversation(String customerId, String storeId, Pageable pageable) {
        log.info("Getting store conversation: customerId={}, storeId={}", customerId, storeId);

        // Validate customer exists
        if (!userRepository.existsById(customerId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "Customer not found");
        }

        // Validate store exists
        if (!storeRepository.existsById(storeId)) {
            throw new NotFoundException(ErrorCode.STORE_NOT_FOUND, "Store not found");
        }

        // Get conversation messages
        Page<ChatMessage> messages = chatMessageRepository.findConversationBetweenCustomerAndStore(
                customerId, storeId, pageable);

        // Convert to response DTOs
        return messages.map(chatMessageMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getStoreConversations(String supplierId, String storeId) {
        log.info("Getting store conversations for supplier: supplierId={}, storeId={}", supplierId, storeId);

        // Validate supplier exists
        if (!userRepository.existsById(supplierId)) {
            throw new NotFoundException(ErrorCode.USER_NOT_FOUND, "Supplier not found");
        }

        // Validate store exists and belongs to supplier
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException(ErrorCode.STORE_NOT_FOUND, "Store not found"));

        if (!store.getSupplier().getUserId().equals(supplierId)) {
            throw new ForbiddenException(ErrorCode.UNAUTHORIZED_ACCESS,
                    "You can only view conversations for your own store");
        }

        // Get all customers who have chatted with this store
        List<String> customerIds = chatMessageRepository.findAllCustomersInStoreConversations(storeId, supplierId);
        log.info("Found {} customers with conversations for store {}", customerIds.size(), storeId);

        List<ConversationResponse> conversations = new ArrayList<>();

        for (String customerId : customerIds) {
            try {
                // Get customer user info
                User customer = userRepository.findById(customerId)
                        .orElseThrow(() -> new NotFoundException(ErrorCode.USER_NOT_FOUND,
                                "Customer not found"));

                // Get last message in this store conversation
                Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 1);
                Page<ChatMessage> messagesPage = chatMessageRepository.findConversationBetweenCustomerAndStore(
                        customerId, storeId, pageable);

                if (messagesPage.hasContent()) {
                    ChatMessage lastMessage = messagesPage.getContent().get(0);

                    // Get unread count
                    Long unreadCount = chatMessageRepository.countUnreadMessagesInStoreConversation(
                            storeId, supplierId, customerId);

                    // Convert to response DTOs
                    UserInfoResponse customerInfo = chatMessageMapper.userToUserInfoResponse(customer);
                    ChatMessageResponse lastMessageResponse = chatMessageMapper.toResponse(lastMessage);

                    // Build conversation response
                    ConversationResponse conversation = ConversationResponse.builder()
                            .otherUser(customerInfo)
                            .lastMessage(lastMessageResponse)
                            .lastMessageTime(lastMessage.getSendTime())
                            .unreadCount(unreadCount)
                            .build();

                    conversations.add(conversation);
                }
            } catch (Exception e) {
                log.error("Error processing store conversation with customer {}: {}", customerId, e.getMessage());
                // Continue to next customer
            }
        }

        // Sort by last message time descending (most recent first)
        conversations.sort((c1, c2) -> c2.getLastMessageTime().compareTo(c1.getLastMessageTime()));

        return conversations;
    }
}
