import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageSquare, Circle, CheckCheck, Users } from 'lucide-react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import chatService from '~/service/chatService';
import supplierService, { type Supplier } from '~/service/supplierService';
import { useAuth } from '~/AuthContext';
import type { ChatMessage, ChatMessageRequest } from '~/service/types';

interface SupplierWithUnread extends Supplier {
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
          
          // Only mark as read if we are the receiver (not sender)
          if (message.receiver.userId === currentUserId) {
            chatService.markAsRead(message.messageId);
          }
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

  const getMessageStatus = (message: ChatMessage) => {
    // Only show status for messages sent by current user (admin)
    if (!currentUserId || message.sender.userId !== currentUserId) return null;

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
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Hỗ trợ Nhà cung cấp</h1>
          <p className="text-gray-600 mt-1">Trò chuyện và hỗ trợ các nhà cung cấp</p>
        </div>

        <div className="flex h-[calc(100vh-220px)] bg-white rounded-lg shadow-md overflow-hidden">
          {/* Suppliers List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Nhà cung cấp</h2>
                <p className="text-xs text-gray-500">{filteredSuppliers.length} đối tác</p>
              </div>
            </div>
            <button
              onClick={loadSuppliers}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
              title="Làm mới"
            >
              <svg className={`w-4 h-4 text-blue-600 ${loadingSuppliers ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhà cung cấp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
              </span>
            </div>
            {selectedSupplier && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Đang chat
              </span>
            )}
          </div>
        </div>

        {/* Suppliers */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {loadingSuppliers ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-500 mb-3" />
              <p className="text-sm text-gray-500">Đang tải danh sách...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                {searchQuery ? 'Không tìm thấy nhà cung cấp' : 'Chưa có nhà cung cấp'}
              </p>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Danh sách nhà cung cấp trống'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.userId}
                  onClick={() => handleSupplierClick(supplier)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedSupplier?.userId === supplier.userId
                      ? 'bg-white border-l-4 border-l-blue-500 shadow-sm'
                      : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={supplier.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(supplier.businessName || supplier.fullName)}
                        alt={supplier.businessName || supplier.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                      />
                      {supplier.unreadCount && supplier.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-md">
                          {supplier.unreadCount > 9 ? '9+' : supplier.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium text-sm truncate ${
                          selectedSupplier?.userId === supplier.userId ? 'text-blue-700' : 'text-gray-900'
                        }`}>
                          {supplier.businessName || supplier.fullName}
                        </h3>
                        {supplier.lastMessageTime && (
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {formatTime(supplier.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {supplier.email}
                      </p>
                      {supplier.status && (
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                          supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          supplier.status === 'PAUSE' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {supplier.status === 'ACTIVE' ? 'Hoạt động' :
                           supplier.status === 'PAUSE' ? 'Tạm ngưng' : supplier.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSupplier ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedSupplier.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedSupplier.businessName || selectedSupplier.fullName)}
                    alt={selectedSupplier.businessName || selectedSupplier.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedSupplier.businessName || selectedSupplier.fullName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {selectedSupplier.email}
                      </p>
                      {selectedSupplier.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          selectedSupplier.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          selectedSupplier.status === 'PAUSE' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedSupplier.status === 'ACTIVE' ? 'Hoạt động' :
                           selectedSupplier.status === 'PAUSE' ? 'Tạm ngưng' : selectedSupplier.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => loadMessages(selectedSupplier.userId)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Làm mới tin nhắn"
                >
                  <svg className={`w-5 h-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2" />
                    <p>Chưa có tin nhắn</p>
                    <p className="text-xs mt-1">Gửi tin nhắn đầu tiên để bắt đầu hỗ trợ</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isOwn = message.sender.userId === currentUserId;
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
                                : 'bg-white text-gray-900 shadow-sm'
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
                            {getMessageStatus(message)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white shadow-sm px-4 py-2 rounded-lg">
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
            <div className="p-4 border-t border-gray-200 bg-white shadow-lg">
              <div className="flex gap-3 items-end">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn hỗ trợ..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center gap-2 font-medium"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </div>
              {isTyping && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Nhà cung cấp đang nhập...</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600">Chọn nhà cung cấp để bắt đầu</p>
              <p className="text-sm text-gray-500 mt-2">Chọn một nhà cung cấp từ danh sách bên trái để trò chuyện</p>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
