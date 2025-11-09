package com.example.backend.repository;

import com.example.backend.entity.ChatMessage;
import com.example.backend.entity.enums.MessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    /**
     * Find all messages between two users (conversation history)
     * Ordered by send time descending (newest first)
     */
    @Query("SELECT cm FROM ChatMessage cm " +
           "WHERE (cm.sender.userId = :userId1 AND cm.receiver.userId = :userId2) " +
           "OR (cm.sender.userId = :userId2 AND cm.receiver.userId = :userId1) " +
           "ORDER BY cm.sendTime DESC")
    Page<ChatMessage> findConversationBetweenUsers(
        @Param("userId1") String userId1,
        @Param("userId2") String userId2,
        Pageable pageable
    );

    /**
     * Find all unread messages for a specific user
     */
    @Query("SELECT cm FROM ChatMessage cm " +
           "WHERE cm.receiver.userId = :userId " +
           "AND cm.status != 'READ' " +
           "ORDER BY cm.sendTime DESC")
    List<ChatMessage> findUnreadMessagesByReceiver(@Param("userId") String userId);

    /**
     * Count unread messages for a specific user
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm " +
           "WHERE cm.receiver.userId = :userId " +
           "AND cm.status != 'READ'")
    Long countUnreadMessagesByReceiver(@Param("userId") String userId);

    /**
     * Find the last message between two users
     */
    @Query("SELECT cm FROM ChatMessage cm " +
           "WHERE (cm.sender.userId = :userId1 AND cm.receiver.userId = :userId2) " +
           "OR (cm.sender.userId = :userId2 AND cm.receiver.userId = :userId1) " +
           "ORDER BY cm.sendTime DESC")
    List<ChatMessage> findLastMessageBetweenUsers(
        @Param("userId1") String userId1,
        @Param("userId2") String userId2,
        Pageable pageable
    );

    /**
     * Find all users that have conversations with the given user
     * Returns distinct user IDs
     */
    @Query("SELECT DISTINCT CASE " +
           "WHEN cm.sender.userId = :userId THEN cm.receiver.userId " +
           "ELSE cm.sender.userId END " +
           "FROM ChatMessage cm " +
           "WHERE cm.sender.userId = :userId OR cm.receiver.userId = :userId")
    List<String> findAllConversationPartners(@Param("userId") String userId);

    /**
     * Count unread messages in a specific conversation
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm " +
           "WHERE cm.receiver.userId = :receiverId " +
           "AND cm.sender.userId = :senderId " +
           "AND cm.status != 'READ'")
    Long countUnreadMessagesInConversation(
        @Param("receiverId") String receiverId,
        @Param("senderId") String senderId
    );

    /**
     * Mark all messages in a conversation as read
     */
    @Modifying
    @Query("UPDATE ChatMessage cm SET cm.status = 'READ' " +
           "WHERE cm.receiver.userId = :receiverId " +
           "AND cm.sender.userId = :senderId " +
           "AND cm.status != 'READ'")
    int markConversationAsRead(
        @Param("receiverId") String receiverId,
        @Param("senderId") String senderId
    );

    /**
     * Update message status by messageId
     */
    @Modifying
    @Query("UPDATE ChatMessage cm SET cm.status = :status " +
           "WHERE cm.messageId = :messageId")
    int updateMessageStatus(
        @Param("messageId") String messageId,
        @Param("status") MessageStatus status
    );

    /**
     * Find messages sent by a user to another user
     */
    @Query("SELECT cm FROM ChatMessage cm " +
           "WHERE cm.sender.userId = :senderId " +
           "AND cm.receiver.userId = :receiverId " +
           "ORDER BY cm.sendTime DESC")
    Page<ChatMessage> findMessagesBySenderAndReceiver(
        @Param("senderId") String senderId,
        @Param("receiverId") String receiverId,
        Pageable pageable
    );

    /**
     * Find conversation between customer and store
     * Customer can be sender or receiver, store context is required
     */
    @Query("SELECT cm FROM ChatMessage cm " +
           "WHERE cm.store.storeId = :storeId " +
           "AND ((cm.sender.userId = :customerId) OR (cm.receiver.userId = :customerId)) " +
           "ORDER BY cm.sendTime DESC")
    Page<ChatMessage> findConversationBetweenCustomerAndStore(
        @Param("customerId") String customerId,
        @Param("storeId") String storeId,
        Pageable pageable
    );

    /**
     * Find all conversations for a store (for supplier to view)
     * Groups by customer
     */
    @Query("SELECT DISTINCT CASE " +
           "WHEN cm.sender.userId != :supplierId THEN cm.sender.userId " +
           "ELSE cm.receiver.userId END " +
           "FROM ChatMessage cm " +
           "WHERE cm.store.storeId = :storeId " +
           "AND (cm.sender.userId = :supplierId OR cm.receiver.userId = :supplierId)")
    List<String> findAllCustomersInStoreConversations(
        @Param("storeId") String storeId,
        @Param("supplierId") String supplierId
    );

    /**
     * Count unread messages for a store from a specific customer
     */
    @Query("SELECT COUNT(cm) FROM ChatMessage cm " +
           "WHERE cm.store.storeId = :storeId " +
           "AND cm.receiver.userId = :supplierId " +
           "AND cm.sender.userId = :customerId " +
           "AND cm.status != 'READ'")
    Long countUnreadMessagesInStoreConversation(
        @Param("storeId") String storeId,
        @Param("supplierId") String supplierId,
        @Param("customerId") String customerId
    );
}
