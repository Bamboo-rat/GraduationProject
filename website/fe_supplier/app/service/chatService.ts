import axiosInstance from '~/config/axios';
import { Client } from '@stomp/stompjs';
import type { StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {
  ChatMessage,
  Conversation,
  ChatMessageRequest,
  Page,
  ApiResponse,
  MessageType
} from './types';

class ChatService {
  private stompClient: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private messageHandlers: Set<(message: ChatMessage) => void> = new Set();
  private readReceiptHandlers: Set<(messageId: string) => void> = new Set();
  private typingHandlers: Set<(senderId: string) => void> = new Set();

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        reject(new Error('No access token found'));
        return;
      }

      // Create SockJS connection
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const resolvedApiBaseUrl =
        apiBaseUrl && apiBaseUrl !== 'undefined' && apiBaseUrl.trim().length > 0
          ? apiBaseUrl
          : typeof window !== 'undefined'
            ? `${window.location.origin}/api`
            : '';
      const wsBaseUrl = resolvedApiBaseUrl.replace(/\/api\/?$/, '');
      const socket = new SockJS(`${wsBaseUrl}/ws/chat`);

      // Create STOMP client
      this.stompClient = new Client({
        webSocketFactory: () => socket as any,
        connectHeaders: {
          token: token, // Use 'token' header instead of 'Authorization' for SockJS compatibility
        },
        debug: (str) => {
          console.log('STOMP:', str);
        },
      reconnectDelay: 2000, // Reduced from 5000 to 2000ms for faster reconnection
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });      // Handle connection
      this.stompClient.onConnect = () => {
        console.log('WebSocket connected');
        this.subscribeToMessages();
        resolve();
      };

      // Handle errors
      this.stompClient.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        reject(new Error('Failed to connect to WebSocket'));
      };

      // Handle disconnect
      this.stompClient.onDisconnect = (frame) => {
        console.log('WebSocket disconnected:', frame);
        // Auto-reconnect will be handled by reconnectDelay setting
      };

      // Activate connection
      this.stompClient.activate();
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.stompClient) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.stompClient.deactivate();
      this.stompClient = null;
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Subscribe to incoming messages
   */
  private subscribeToMessages(): void {
    if (!this.stompClient) return;

    // Subscribe to messages
    const messageSub = this.stompClient.subscribe('/user/queue/messages', (message) => {
      const chatMessage: ChatMessage = JSON.parse(message.body);
      this.messageHandlers.forEach((handler) => handler(chatMessage));
    });
    this.subscriptions.set('messages', messageSub);

    // Subscribe to read receipts
    const readSub = this.stompClient.subscribe('/user/queue/read-receipts', (message) => {
      const messageId: string = message.body;
      this.readReceiptHandlers.forEach((handler) => handler(messageId));
    });
    this.subscriptions.set('read-receipts', readSub);

    // Subscribe to typing indicators
    const typingSub = this.stompClient.subscribe('/user/queue/typing', (message) => {
      const senderId: string = message.body;
      this.typingHandlers.forEach((handler) => handler(senderId));
    });
    this.subscriptions.set('typing', typingSub);

    // Subscribe to errors
    const errorSub = this.stompClient.subscribe('/user/queue/errors', (message) => {
      console.error('WebSocket error:', message.body);
    });
    this.subscriptions.set('errors', errorSub);
  }

  /**
   * Send message via WebSocket
   */
  sendMessageViaWebSocket(request: ChatMessageRequest): void {
    if (!this.stompClient || !this.stompClient.connected) {
      throw new Error('WebSocket not connected');
    }

    this.stompClient.publish({
      destination: '/app/chat/send',
      body: JSON.stringify(request),
    });
  }

  /**
   * Send typing indicator via WebSocket
   */
  sendTypingIndicator(receiverId: string): void {
    if (!this.stompClient || !this.stompClient.connected) return;

    this.stompClient.publish({
      destination: '/app/chat/typing',
      body: receiverId,
    });
  }

  /**
   * Mark message as read via WebSocket
   */
  markAsReadViaWebSocket(messageId: string): void {
    if (!this.stompClient || !this.stompClient.connected) return;

    this.stompClient.publish({
      destination: '/app/chat/read',
      body: messageId,
    });
  }

  /**
   * Add message handler
   */
  onMessage(handler: (message: ChatMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Add read receipt handler
   */
  onReadReceipt(handler: (messageId: string) => void): () => void {
    this.readReceiptHandlers.add(handler);
    return () => this.readReceiptHandlers.delete(handler);
  }

  /**
   * Add typing indicator handler
   */
  onTypingIndicator(handler: (senderId: string) => void): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  // ============= REST API Methods =============

  /**
   * Send a message via REST API
   */
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessage> {
    const response = await axiosInstance.post<ApiResponse<ChatMessage>>('/chat/send', request);
    return response.data.data;
  }

  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    const response = await axiosInstance.get<ApiResponse<Conversation[]>>('/chat/conversations');
    return response.data.data;
  }

  /**
   * Get conversation history with another user
   */
  async getConversation(
    otherUserId: string,
    page: number = 0,
    size: number = 20
  ): Promise<Page<ChatMessage>> {
    const response = await axiosInstance.get<ApiResponse<Page<ChatMessage>>>(
      `/chat/conversations/${otherUserId}`,
      { params: { page, size } }
    );
    return response.data.data;
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    await axiosInstance.post(`/chat/messages/${messageId}/read`);
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(otherUserId: string): Promise<void> {
    await axiosInstance.post(`/chat/conversations/${otherUserId}/read`);
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<number> {
    const response = await axiosInstance.get<ApiResponse<number>>('/chat/unread-count');
    return response.data.data;
  }

  /**
   * Get a specific message
   */
  async getMessage(messageId: string): Promise<ChatMessage> {
    const response = await axiosInstance.get<ApiResponse<ChatMessage>>(`/chat/messages/${messageId}`);
    return response.data.data;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await axiosInstance.delete(`/chat/messages/${messageId}`);
  }

  /**
   * Get all customer conversations for a specific store (Supplier only)
   */
  async getStoreConversations(storeId: string): Promise<Conversation[]> {
    const response = await axiosInstance.get<ApiResponse<Conversation[]>>(
      `/chat/supplier/store/${storeId}/conversations`
    );
    return response.data.data;
  }

  /**
   * Get customer-store conversation history (Customer side)
   */
  async getStoreConversation(
    storeId: string,
    page: number = 0,
    size: number = 20
  ): Promise<Page<ChatMessage>> {
    const response = await axiosInstance.get<ApiResponse<Page<ChatMessage>>>(
      `/chat/store/${storeId}/conversation`,
      { params: { page, size } }
    );
    return response.data.data;
  }
}

export default new ChatService();
