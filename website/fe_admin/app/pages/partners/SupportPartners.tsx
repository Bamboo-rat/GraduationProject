import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, MessageSquare, Users, RefreshCw, Circle, CheckCircle2, CheckCheck } from 'lucide-react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import chatService from '~/service/chatService';
import supplierService, { type Supplier } from '~/service/supplierService';
import { useAuth } from '~/AuthContext';
import type { ChatMessage, ChatMessageRequest } from '~/service/types';
import { MessageStatus, MessageType } from '~/service/types';

interface SupplierWithUnread extends Supplier {
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
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);

  // Simple auto-scroll
  const scrollToBottom = useCallback(() => {
    if (isAutoScrollEnabled.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAutoScrollEnabled.current = isNearBottom;
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // WebSocket connection với message handling
  useEffect(() => {
    let mounted = true;

    const handleIncomingMessage = (message: ChatMessage) => {
      if (!mounted) return;

      // Check if message belongs to current conversation
      const isForCurrentConversation = selectedSupplier && (
        message.sender.userId === selectedSupplier.userId ||
        message.receiver.userId === selectedSupplier.userId
      );

      if (isForCurrentConversation) {
        // Add message to current conversation
        setMessages(prev => {
          const exists = prev.some(m => m.messageId === message.messageId);
          if (exists) {
            // Update message status if exists
            return prev.map(m =>
              m.messageId === message.messageId ? message : m
            );
          }
          return [...prev, message];
        });

        // Mark as read if we're the receiver
        if (message.receiver.userId === currentUserId && message.status !== MessageStatus.READ) {
          setTimeout(() => {
            chatService.markAsReadViaWebSocket(message.messageId);
          }, 500);
        }
      }
    };

    const setupWebSocket = async () => {
      try {
        await chatService.connect();
        if (mounted) {
          setIsConnected(true);
          // Subscribe to messages
          chatService.onMessage(handleIncomingMessage);
        }
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    setupWebSocket();

    return () => {
      mounted = false;
      chatService.disconnect();
    };
  }, [selectedSupplier, currentUserId]);

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await supplierService.getAllSuppliers(0, 100, undefined, '', 'businessName', 'ASC');
      const suppliersData = response.content;

      // Get conversations
      const conversations = await chatService.getConversations();

      const suppliersWithUnread: SupplierWithUnread[] = suppliersData.map(supplier => {
        const conv = conversations.find(c => c.otherUser.userId === supplier.userId);
        return {
          ...supplier,
          lastMessageTime: conv?.lastMessageTime
        };
      });

      // Sort by last message time
      suppliersWithUnread.sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        }
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        return (a.businessName || '').localeCompare(b.businessName || '');
      });

      setSuppliers(suppliersWithUnread);
    } catch (error: any) {
      console.error('Failed to load suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadMessages = async (supplierId: string) => {
    setLoading(true);
    try {
      const data = await chatService.getConversation(supplierId, 0, 50);
      setMessages(data.content.reverse());

      // Mark conversation as read
      await chatService.markConversationAsRead(supplierId);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierClick = useCallback((supplier: SupplierWithUnread) => {
    setSelectedSupplier(supplier);
    loadMessages(supplier.userId);
  }, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedSupplier || !currentUserId || !user || sending) return;

    const content = messageInput.trim();
    const request: ChatMessageRequest = {
      content,
      receiverId: selectedSupplier.userId,
      type: MessageType.TEXT,
    };

    // Create optimistic message
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      messageId: tempMessageId,
      content,
      sendTime: new Date().toISOString(),
      sender: {
        userId: currentUserId,
        keycloakId: user.keycloakId || '',
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        fullName: user.fullName || 'Admin',
        gender: user.gender,
        avatarUrl: user.avatarUrl || '',
        active: true,
        userType: 'ADMIN',
        status: 'ACTIVE',
        roles: user.roles,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString()
      },
      receiver: {
        userId: selectedSupplier.userId,
        keycloakId: selectedSupplier.keycloakId || '',
        username: selectedSupplier.username || '',
        email: selectedSupplier.email || '',
        phoneNumber: selectedSupplier.phoneNumber || '',
        fullName: selectedSupplier.businessName || selectedSupplier.fullName,
        avatarUrl: selectedSupplier.avatarUrl || '',
        active: selectedSupplier.active,
        userType: 'SUPPLIER',
        status: selectedSupplier.status || 'ACTIVE',
        createdAt: selectedSupplier.createdAt || '',
        updatedAt: selectedSupplier.updatedAt || ''
      },
      status: MessageStatus.SENT,
      type: MessageType.TEXT
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    setSending(true);

    try {
      if (isConnected) {
        chatService.sendMessageViaWebSocket(request);
      } else {
        await chatService.sendMessage(request);
      }

      // Update last message time
      setSuppliers(prev => prev.map(s =>
        s.userId === selectedSupplier.userId
          ? { ...s, lastMessageTime: new Date().toISOString() }
          : s
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.messageId !== tempMessageId));
      setMessageInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simple filtered suppliers
  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     supplier.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    return date.toLocaleDateString('vi-VN');
  };

  const getMessageStatus = (message: ChatMessage) => {
    if (!currentUserId || message.sender.userId !== currentUserId) return null;

    switch (message.status) {
      case MessageStatus.SENT:
        return (
          <div className="flex items-center gap-0.5" title="Đã gửi">
            <Circle className="w-3 h-3 text-gray-400" fill="currentColor" />
          </div>
        );
      case MessageStatus.DELIVERED:
        return (
          <div className="flex items-center gap-0.5" title="Đã nhận">
            <CheckCircle2 className="w-3 h-3 text-gray-400" />
          </div>
        );
      case MessageStatus.READ:
        return (
          <div className="flex items-center gap-0.5" title="Đã xem">
            <CheckCheck className="w-3 h-3 text-green-600" />
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-0.5" title="Đã gửi">
            <Circle className="w-3 h-3 text-gray-400" fill="currentColor" />
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-[#A8D5BA]" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-[#2D3748]">Hỗ trợ nhà cung cấp</h1>
                <p className="text-[#718096] mt-1">
                  {isConnected ? '🟢 Đang kết nối' : '🔴 Mất kết nối'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden min-h-0">
          {/* Suppliers Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <h2 className="font-semibold text-[#2D3748]">Nhà cung cấp</h2>
                </div>
                <button
                  onClick={loadSuppliers}
                  disabled={loadingSuppliers}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-[#6C9A8F] ${loadingSuppliers ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-[#A8D5BA] bg-white"
                />
              </div>
            </div>

            {/* Suppliers List */}
            <div className="flex-1 overflow-y-auto bg-white min-h-0">
              {loadingSuppliers ? (
                <div className="flex items-center justify-center h-full p-8">
                  <RefreshCw className="w-6 h-6 text-[#A8D5BA] animate-spin" />
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="flex items-center justify-center h-full p-8 text-center">
                  <Users className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'Không tìm thấy' : 'Chưa có nhà cung cấp'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.userId}
                      onClick={() => handleSupplierClick(supplier)}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedSupplier?.userId === supplier.userId
                          ? 'bg-[#E8F5E9] border-l-4 border-l-[#A8D5BA]'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={supplier.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(supplier.businessName || supplier.fullName || '')}&background=A8D5BA&color=fff`}
                          alt={supplier.businessName || supplier.fullName}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className={`font-medium text-sm truncate ${
                              selectedSupplier?.userId === supplier.userId ? 'text-[#2D7D46]' : 'text-gray-900'
                            }`}>
                              {supplier.businessName || supplier.fullName}
                            </h3>
                            {supplier.lastMessageTime && (
                              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {formatTime(supplier.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {supplier.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedSupplier ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedSupplier.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSupplier.businessName || selectedSupplier.fullName || '')}&background=A8D5BA&color=fff`}
                        alt={selectedSupplier.businessName || selectedSupplier.fullName}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedSupplier.businessName || selectedSupplier.fullName}
                        </h3>
                        <p className="text-sm text-gray-500">{selectedSupplier.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => selectedSupplier && loadMessages(selectedSupplier.userId)}
                      disabled={loading}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 min-h-0"
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-6 h-6 text-[#A8D5BA] animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Chưa có tin nhắn</p>
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
                            <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                              <div
                                className={`px-4 py-2 rounded-2xl ${
                                  isOwn
                                    ? 'bg-[#A8D5BA] text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 px-1 mt-1">
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
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn..."
                      disabled={sending}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-[#A8D5BA] bg-white disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="px-4 py-2 bg-[#A8D5BA] text-white rounded-lg hover:bg-[#8BBF9E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? '...' : 'Gửi'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-0">
                <div className="text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-900 mb-1">Chọn nhà cung cấp</p>
                  <p className="text-sm">Chọn từ danh sách để bắt đầu trò chuyện</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}