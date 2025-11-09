import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageSquare, Circle, CheckCheck, Users } from 'lucide-react';
import chatService from '~/service/chatService';
import supplierService from '~/service/supplierService';
import { useAuth } from '~/AuthContext';
import type { ChatMessage, ChatMessageRequest } from '~/service/types';
import type { SupplierResponse } from '~/service/supplierService';

interface SupplierWithUnread extends SupplierResponse {
  unreadCount?: number;
  lastMessageTime?: string;
}

export default function SupportPartners() {
  const { user } = useAuth();
  const currentUserId = user?.userId;
  
  const [suppliers, setSuppliers] = useState<SupplierWithUnread[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithUnread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedSupplierRef = useRef<SupplierWithUnread | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedSupplierRef.current = selectedSupplier;
  }, [selectedSupplier]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load suppliers and connect WebSocket on mount
  useEffect(() => {
    loadSuppliers();
    connectWebSocket();

    return () => {
      chatService.disconnect();
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      await chatService.connect();
      setIsConnected(true);

      // Subscribe to incoming messages - use ref to get current selection
      const unsubscribeMessage = chatService.onMessage((message: ChatMessage) => {
        const current = selectedSupplierRef.current;
        
        // Add message if it matches current conversation
        if (current && current.userId &&
            (message.sender.userId === current.userId || 
             message.receiver.userId === current.userId)) {
          setMessages(prev => [...prev, message]); // Append to end
          // Mark as read immediately
          chatService.markAsRead(message.messageId);
        }
        
        // Update unread counts for all suppliers
        loadSuppliers();
      });

      // Subscribe to typing indicators - use ref to get current selection
      const unsubscribeTyping = chatService.onTypingIndicator((senderId: string) => {
        const current = selectedSupplierRef.current;
        if (current && current.userId && senderId === current.userId) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      });

      return () => {
        unsubscribeMessage();
        unsubscribeTyping();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      // Get all suppliers
      const response = await supplierService.getAllSuppliers(0, 100, undefined, '', 'businessName', 'ASC');
      const suppliersData = response.content;

      // Get conversations to find unread counts
      const conversations = await chatService.getConversations();
      
      // Merge unread counts with suppliers
      const suppliersWithUnread: SupplierWithUnread[] = suppliersData.map(supplier => {
        const conv = conversations.find(c => c.otherUser.userId === supplier.userId);
        return {
          ...supplier,
          unreadCount: conv?.unreadCount || 0,
          lastMessageTime: conv?.lastMessageTime
        };
      });

      // Sort by last message time (most recent first), then by name
      suppliersWithUnread.sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        }
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        return a.businessName.localeCompare(b.businessName);
      });

      setSuppliers(suppliersWithUnread);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadMessages = async (supplierId: string) => {
    setLoading(true);
    try {
      const data = await chatService.getConversation(supplierId, 0, 50);
      // Keep ascending order (oldest first)
      setMessages(data.content.reverse());
      
      // Mark conversation as read
      await chatService.markConversationAsRead(supplierId);
      
      // Refresh suppliers to update unread count
      loadSuppliers();
    } catch (error) {
      console.error('Failed to load messages:', error);
      // If no conversation exists yet, just set empty messages
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierClick = (supplier: SupplierWithUnread) => {
    setSelectedSupplier(supplier);
    loadMessages(supplier.userId);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedSupplier) return;

    const request: ChatMessageRequest = {
      content: messageInput.trim(),
      receiverId: selectedSupplier.userId,
      type: 'TEXT' as any, // MessageType.TEXT
    };

    try {
      if (isConnected) {
        // Send via WebSocket for real-time delivery
        chatService.sendMessageViaWebSocket(request);
        setMessageInput('');
      } else {
        // Fallback to REST API
        const message = await chatService.sendMessage(request);
        setMessages(prev => [...prev, message]); // Append to end
        setMessageInput('');
      }
      
      // Refresh suppliers to update last message time
      loadSuppliers();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Send typing indicator
    if (selectedSupplier && isConnected) {
      chatService.sendTypingIndicator(selectedSupplier.userId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     supplier.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getMessageStatus = (message: ChatMessage, currentUserId: string | undefined) => {
    if (message.sender.userId !== currentUserId) return null;

    switch (message.status) {
      case 'SENT':
        return <Circle className="w-3 h-3 text-gray-400" />;
      case 'DELIVERED':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'READ':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow-md">
      {/* Suppliers List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Nhà cung cấp</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhà cung cấp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
            </span>
          </div>
        </div>

        {/* Suppliers */}
        <div className="flex-1 overflow-y-auto">
          {loadingSuppliers ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Users className="w-12 h-12 mb-2" />
              <p className="text-sm">Không tìm thấy nhà cung cấp</p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <div
                key={supplier.userId}
                onClick={() => handleSupplierClick(supplier)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedSupplier?.userId === supplier.userId
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={supplier.avatarUrl || '/default-avatar.png'}
                    alt={supplier.businessName || supplier.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {supplier.businessName || supplier.fullName}
                      </h3>
                      {supplier.lastMessageTime && (
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatTime(supplier.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate">
                        {supplier.email}
                      </p>
                      {supplier.unreadCount && supplier.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                          {supplier.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <img
                src={selectedConversation.otherUser.avatarUrl || '/default-avatar.png'}
                alt={selectedConversation.otherUser.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{selectedConversation.otherUser.fullName}</h3>
                <p className="text-sm text-gray-500">{selectedConversation.otherUser.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>Chưa có tin nhắn</p>
                </div>
              ) : (
                <>
                  {[...messages].reverse().map((message) => {
                    const isOwn = message.sender.userId !== selectedConversation.otherUser.userId;
                    return (
                      <div
                        key={message.messageId}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          <div className="flex items-center gap-1 px-1">
                            <span className="text-xs text-gray-500">
                              {new Date(message.sendTime).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {getMessageStatus(message, message.sender.userId)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
