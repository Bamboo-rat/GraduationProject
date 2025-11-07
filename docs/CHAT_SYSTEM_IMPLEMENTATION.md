# Chat System Implementation Guide

## Overview

This document describes the complete chat messaging system for SaveFood platform, enabling real-time communication between:
- **Customer ↔ Supplier**
- **Customer ↔ Admin**
- **Supplier ↔ Admin**

## ✅ Implemented Components

### Backend (100% Complete)

#### 1. Entity & Enums
- **ChatMessage Entity** (`backend/src/main/java/com/example/backend/entity/ChatMessage.java`)
  - Fields: messageId, content, sendTime, sender, receiver, status, type
  - Relationships: Many-to-One with User (sender and receiver)
  - Uses LAZY loading for User relationships

- **MessageStatus Enum** (`backend/src/main/java/com/example/backend/entity/enums/MessageStatus.java`)
  - SENT, DELIVERED, READ

- **MessageType Enum** (`backend/src/main/java/com/example/backend/entity/enums/MessageType.java`)
  - TEXT, IMAGE, FILE, ORDER_LINK

#### 2. Repository
- **ChatMessageRepository** (`backend/src/main/java/com/example/backend/repository/ChatMessageRepository.java`)
  - findConversationBetweenUsers() - Paginated conversation history
  - findUnreadMessagesByReceiver() - Get all unread messages
  - countUnreadMessagesByReceiver() - Count unread messages
  - findLastMessageBetweenUsers() - Get last message in conversation
  - findAllConversationPartners() - Get all users with conversations
  - countUnreadMessagesInConversation() - Count unread in specific conversation
  - markConversationAsRead() - Bulk update message status
  - updateMessageStatus() - Update single message status

#### 3. DTOs
- **ChatMessageRequest** (`backend/src/main/java/com/example/backend/dto/request/ChatMessageRequest.java`)
  - Fields: content, receiverId, type, fileUrl
  - Validation: @NotBlank on content and receiverId

- **ChatMessageResponse** (`backend/src/main/java/com/example/backend/dto/response/ChatMessageResponse.java`)
  - Fields: messageId, content, sendTime, sender, receiver, status, type, fileUrl
  - Uses UserInfoResponse for sender/receiver

- **ConversationResponse** (`backend/src/main/java/com/example/backend/dto/response/ConversationResponse.java`)
  - Fields: otherUser, lastMessage, lastMessageTime, unreadCount

#### 4. Mapper
- **ChatMessageMapper** (`backend/src/main/java/com/example/backend/mapper/ChatMessageMapper.java`)
  - Maps ChatMessage entity to ChatMessageResponse DTO
  - Handles polymorphic User types (Customer, Supplier, Admin)
  - Custom userToUserInfoResponse() method

#### 5. Service Layer
- **ChatService Interface** (`backend/src/main/java/com/example/backend/service/ChatService.java`)
- **ChatServiceImpl** (`backend/src/main/java/com/example/backend/service/impl/ChatServiceImpl.java`)
  - sendMessage() - Send new message
  - getConversation() - Get paginated conversation history
  - getConversations() - Get all conversations with summary
  - markAsRead() - Mark single message as read
  - markConversationAsRead() - Mark all messages in conversation as read
  - getUnreadCount() - Get total unread count
  - getMessage() - Get specific message
  - deleteMessage() - Delete message (sender only)

#### 6. REST API
- **ChatController** (`backend/src/main/java/com/example/backend/controller/ChatController.java`)
  - POST /api/chat/send - Send message
  - GET /api/chat/conversations - Get all conversations
  - GET /api/chat/conversations/{otherUserId} - Get conversation history
  - POST /api/chat/messages/{messageId}/read - Mark message as read
  - POST /api/chat/conversations/{otherUserId}/read - Mark conversation as read
  - GET /api/chat/unread-count - Get unread count
  - GET /api/chat/messages/{messageId} - Get message by ID
  - DELETE /api/chat/messages/{messageId} - Delete message

#### 7. WebSocket Configuration
- **WebSocketConfig** (`backend/src/main/java/com/example/backend/config/WebSocketConfig.java`)
  - STOMP endpoint: /ws/chat with SockJS fallback
  - Message broker: /queue and /topic
  - Application prefix: /app
  - User destination prefix: /user

- **JwtChannelInterceptor** (`backend/src/main/java/com/example/backend/config/JwtChannelInterceptor.java`)
  - Authenticates WebSocket connections with JWT
  - Extracts token from Authorization header or token parameter
  - Validates JWT and sets Spring Security authentication

- **ChatWebSocketController** (`backend/src/main/java/com/example/backend/controller/ChatWebSocketController.java`)
  - @MessageMapping("/chat/send") - Send message via WebSocket
  - @MessageMapping("/chat/read") - Mark message as read via WebSocket
  - @MessageMapping("/chat/typing") - Send typing indicator
  - Broadcasts to /user/{userId}/queue/messages
  - Broadcasts to /user/{userId}/queue/read-receipts
  - Broadcasts to /user/{userId}/queue/typing

#### 8. Error Codes
Added to `ErrorCode` enum (7xxx series):
- MESSAGE_NOT_FOUND (7001)
- CONVERSATION_NOT_FOUND (7002)
- CANNOT_SEND_MESSAGE_TO_SELF (7003)
- MESSAGE_SEND_FAILED (7004)
- UNAUTHORIZED_MESSAGE_ACCESS (7005)
- CANNOT_DELETE_MESSAGE (7006)
- MESSAGE_ALREADY_READ (7007)
- FILE_UPLOAD_FAILED_CHAT (7008)
- INVALID_MESSAGE_TYPE (7009)

### Frontend (Service Layer Complete, UI Pending)

#### 1. TypeScript Types
Added to `app/service/types.ts` in both portals:
- MessageStatus enum
- MessageType enum
- UserInfo interface
- ChatMessage interface
- Conversation interface
- ChatMessageRequest interface

#### 2. Chat Service
- **chatService.ts** (Admin & Supplier portals)
  - WebSocket connection management (connect/disconnect)
  - STOMP client with SockJS fallback
  - Message handlers (onMessage, onReadReceipt, onTypingIndicator)
  - REST API methods:
    - sendMessage() - HTTP POST
    - getConversations() - Get all conversations
    - getConversation() - Get conversation history
    - markAsRead() - Mark message as read
    - markConversationAsRead() - Mark all as read
    - getUnreadCount() - Get unread count
    - getMessage() - Get message by ID
    - deleteMessage() - Delete message
  - WebSocket methods:
    - sendMessageViaWebSocket()
    - sendTypingIndicator()
    - markAsReadViaWebSocket()

---

## 📋 Remaining Tasks

### Frontend UI Components (Not Implemented)

You need to create the following React components in both admin and supplier portals:

#### 1. Chat Page (`app/pages/Chat.tsx` or `app/pages/chat/ChatPage.tsx`)
Main chat page that integrates all chat components.

**Responsibilities:**
- Initialize WebSocket connection on mount
- Disconnect WebSocket on unmount
- Manage chat state (conversations, selected user, messages)
- Handle real-time message updates

**Example Structure:**
```tsx
import { useState, useEffect } from 'react';
import chatService from '~/service/chatService';
import ConversationsList from '~/component/features/ConversationsList';
import ChatWindow from '~/component/features/ChatWindow';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Connect to WebSocket
    chatService.connect();
    loadConversations();

    // Subscribe to new messages
    const unsubscribe = chatService.onMessage((message) => {
      // Update conversations and messages
    });

    return () => {
      unsubscribe();
      chatService.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen">
      <ConversationsList
        conversations={conversations}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
      />
      <ChatWindow
        userId={selectedUserId}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
```

#### 2. ConversationsList Component
Displays list of all conversations with preview.

**Features:**
- List of conversations sorted by last message time
- Search functionality
- Unread badge indicators
- Last message preview
- User avatar and name
- Click to select conversation

**Location:** `app/component/features/ConversationsList.tsx`

#### 3. ChatWindow Component
Main chat area for displaying messages and sending new messages.

**Features:**
- Display message history (paginated, infinite scroll)
- Message input field
- Send button
- File upload button (optional)
- Scroll to bottom on new message
- Loading states
- Empty state (no conversation selected)
- Read receipts
- Typing indicators

**Location:** `app/component/features/ChatWindow.tsx`

#### 4. MessageBubble Component
Individual message display with styling.

**Features:**
- Different styling for sent vs received messages
- Message status indicator (sent/delivered/read)
- Timestamp (show on hover or below message)
- Sender avatar (for received messages)
- Delete button (for own messages, show on hover)
- Support for different message types (TEXT, IMAGE, FILE)

**Location:** `app/component/features/MessageBubble.tsx`

#### 5. MessageInput Component
Input area for composing messages.

**Features:**
- Text input field (textarea with auto-resize)
- Send button
- File upload button (optional)
- Character count (optional)
- Typing indicator trigger (send after 500ms of no typing)
- Enter to send, Shift+Enter for new line

**Location:** `app/component/features/MessageInput.tsx`

#### 6. Routes Configuration
Add chat routes to both portals.

**Admin Portal** (`app/routes/chat.tsx` or `app/routes/messages/index.tsx`):
```tsx
import ChatPage from '~/pages/Chat';

export default function ChatRoute() {
  return <ChatPage />;
}
```

**Menu Configuration** (`app/component/layout/menu.json`):
```json
{
  "label": "Messages",
  "path": "/messages",
  "icon": "MessageSquare"
}
```

---

## 🔧 Installation Requirements

### Backend Dependencies
All required dependencies are already in `pom.xml`:
- spring-boot-starter-websocket ✅
- spring-boot-starter-data-jpa ✅
- spring-boot-starter-security ✅
- spring-boot-starter-oauth2-resource-server ✅

### Frontend Dependencies
Add the following to `package.json` in both portals:

```bash
cd website/fe_admin
npm install @stomp/stompjs sockjs-client
npm install --save-dev @types/sockjs-client

cd ../fe_supplier
npm install @stomp/stompjs sockjs-client
npm install --save-dev @types/sockjs-client
```

---

## 🚀 How to Test

### 1. Start Backend
```bash
cd backend
./run.ps1
```

### 2. Start Frontend (Admin)
```bash
cd website/fe_admin
npm run dev
```

### 3. Start Frontend (Supplier)
```bash
cd website/fe_supplier
npm run dev
```

### 4. Test REST API
Use Swagger UI: http://localhost:8080/swagger-ui/index.html

**Test Endpoints:**
1. POST /api/chat/send - Send a message
2. GET /api/chat/conversations - Get conversations
3. GET /api/chat/conversations/{otherUserId}?page=0&size=20 - Get conversation history
4. GET /api/chat/unread-count - Get unread count

### 5. Test WebSocket
1. Login to admin portal and supplier portal with different accounts
2. Open browser console
3. WebSocket connection should log "WebSocket connected"
4. Send a message from one portal
5. Check if it appears in real-time in the other portal

---

## 📊 Database Schema

The `chat_messages` table is automatically created by Hibernate with the following structure:

```sql
CREATE TABLE chat_messages (
  message_id VARCHAR(255) PRIMARY KEY,
  content TEXT NOT NULL,
  send_time TIMESTAMP NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  receiver_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SENT',
  type VARCHAR(20) NOT NULL DEFAULT 'TEXT',
  FOREIGN KEY (sender_id) REFERENCES users(user_id),
  FOREIGN KEY (receiver_id) REFERENCES users(user_id)
);

-- Recommended indexes for performance
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_status ON chat_messages(status);
CREATE INDEX idx_chat_sendtime ON chat_messages(send_time);
CREATE INDEX idx_chat_conversation ON chat_messages(sender_id, receiver_id, send_time DESC);
```

---

## 🎨 UI Design Recommendations

### Layout
- **Split view**: Conversations list (left) + Chat window (right)
- **Responsive**: Stack vertically on mobile, side-by-side on desktop
- **Conversations list width**: 300-400px on desktop

### Colors & Styling
- **Sent messages**: Blue/primary color background, align right
- **Received messages**: Gray background, align left
- **Unread badge**: Red background with white text
- **Typing indicator**: Animated dots (...)
- **Read receipts**: Blue checkmark icons

### Message Status Icons
- **SENT**: Single gray checkmark ✓
- **DELIVERED**: Double gray checkmarks ✓✓
- **READ**: Double blue checkmarks ✓✓

---

## 🔐 Security Considerations

1. **JWT Authentication**: All WebSocket connections require valid JWT token
2. **Authorization**: Users can only:
   - View their own messages
   - Send messages to other active users
   - Delete their own messages
   - Mark received messages as read
3. **Rate Limiting**: Consider adding rate limiting for message sending (optional)
4. **Input Validation**: All message content is validated on backend

---

## 🐛 Troubleshooting

### WebSocket Connection Issues
1. Check CORS configuration in WebSocketConfig
2. Verify JWT token is valid and not expired
3. Check browser console for STOMP errors
4. Ensure backend is running on http://localhost:8080

### Messages Not Appearing
1. Verify WebSocket connection is established
2. Check if message handlers are registered
3. Look for errors in browser console
4. Check backend logs for exceptions

### Database Errors
1. Ensure `chat_messages` table exists
2. Check foreign key constraints on users table
3. Verify JPA entity relationships are correct

---

## 📚 Additional Resources

- **STOMP Protocol**: https://stomp.github.io/
- **SockJS**: https://github.com/sockjs/sockjs-client
- **Spring WebSocket**: https://docs.spring.io/spring-framework/reference/web/websocket.html
- **React Router 7**: https://reactrouter.com/

---

## ✅ Summary

**Backend Implementation**: 100% Complete ✓
- Repository with optimized queries
- Service layer with business logic
- REST API with JWT authentication
- WebSocket with STOMP protocol
- Real-time message broadcasting
- Read receipts and typing indicators

**Frontend Implementation**: 50% Complete
- ✅ TypeScript types defined
- ✅ Service layer with REST API and WebSocket
- ❌ UI components (not implemented)
- ❌ Routes configuration (not implemented)

**Next Steps:**
1. Install frontend dependencies (@stomp/stompjs, sockjs-client)
2. Create UI components (ChatPage, ConversationsList, ChatWindow, MessageBubble, MessageInput)
3. Add routes to menu configuration
4. Test end-to-end flow
5. Add error handling and loading states
6. Implement file upload for images/documents (optional)
7. Add emoji picker (optional)
8. Add notifications for new messages (optional)
