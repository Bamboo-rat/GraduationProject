import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, MessageSquare, Users, RefreshCw, Circle, CheckCheck } from 'lucide-react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import chatService from '~/service/chatService';
import supplierService, { type Supplier } from '~/service/supplierService';
import { useAuth } from '~/AuthContext';
import type { ChatMessage, ChatMessageRequest } from '~/service/types';
import { MessageStatus, MessageType } from '~/service/types';

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
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);
  const messageCleanupRef = useRef<(() => void) | null>(null);

  // Optimized auto-scroll with user scroll detection
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (isAutoScrollEnabled.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Detect if user manually scrolled up
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    // Enable auto-scroll only if user is near bottom
    isAutoScrollEnabled.current = isNearBottom;
  }, []);

  // Auto-scroll when messages change (only if user is at bottom)
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll to bottom when selecting new conversation
  useEffect(() => {
    if (selectedSupplier) {
      isAutoScrollEnabled.current = true;
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  }, [selectedSupplier, scrollToBottom]);

  // Memoized message handler
  const handleIncomingMessage = useCallback((message: ChatMessage) => {
    console.log('Received message:', message);

    // Check if message belongs to current conversation
    const isForCurrentConversation = selectedSupplier && (
      message.sender.userId === selectedSupplier.userId ||
      message.receiver.userId === selectedSupplier.userId
    );

    if (isForCurrentConversation) {
      // Add message to current conversation
      setMessages(prev => {
        // Avoid duplicates by checking messageId
        const exists = prev.some(m => m.messageId === message.messageId);
        if (exists) {
          // Replace temporary message with real one
          return prev.map(m =>
            m.messageId.startsWith('temp-') &&
            m.content === message.content &&
            m.sender.userId === message.sender.userId
              ? message
              : m
          );
        }
        return [...prev, message];
      });

      // Mark as read if we're the receiver
      if (message.receiver.userId === currentUserId) {
        setTimeout(() => {
          chatService.markAsReadViaWebSocket(message.messageId);
        }, 500);
      }
    } else {
      // Update unread count for other conversations
      setSuppliers(prev => prev.map(s => {
        if (s.userId === message.sender.userId || s.userId === message.receiver.userId) {
          const isMessageFromSupplier = message.sender.userId === s.userId;
          return {
            ...s,
            unreadCount: isMessageFromSupplier ? (s.unreadCount || 0) + 1 : s.unreadCount,
            lastMessageTime: message.sendTime
          };
        }
        return s;
      }));
    }
  }, [selectedSupplier, currentUserId]);

  // WebSocket connection with proper cleanup
  useEffect(() => {
    let mounted = true;

    const setupWebSocket = async () => {
      try {
        await chatService.connect();

        if (!mounted) return;

        setIsConnected(true);
        console.log('WebSocket connected successfully');

        // Subscribe to messages
        const unsubscribe = chatService.onMessage(handleIncomingMessage);
        messageCleanupRef.current = unsubscribe;
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    setupWebSocket();

    // Cleanup function
    return () => {
      mounted = false;
      if (messageCleanupRef.current) {
        messageCleanupRef.current();
        messageCleanupRef.current = null;
      }
      chatService.disconnect();
    };
  }, [handleIncomingMessage]);

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await supplierService.getAllSuppliers(0, 100, undefined, '', 'businessName', 'ASC');
      const suppliersData = response.content;

      // Get conversations with unread counts
      const conversations = await chatService.getConversations();

      const suppliersWithUnread: SupplierWithUnread[] = suppliersData.map(supplier => {
        const conv = conversations.find(c => c.otherUser.userId === supplier.userId);
        return {
          ...supplier,
          unreadCount: conv?.unreadCount || 0,
          lastMessageTime: conv?.lastMessageTime
        };
      });

      // Sort: conversations with messages first, then by time, then alphabetically
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

      // Messages come in DESC order (newest first), reverse to show oldest first
      setMessages(data.content.reverse());

      // Mark all messages as read
      await chatService.markConversationAsRead(supplierId);

      // Clear unread count
      setSuppliers(prev => prev.map(s =>
        s.userId === supplierId ? { ...s, unreadCount: 0 } : s
      ));
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
    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
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

    // Add optimistic message and clear input immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    setSending(true);

    // Enable auto-scroll for new message
    isAutoScrollEnabled.current = true;
    setTimeout(() => scrollToBottom('smooth'), 0);

    try {
      if (isConnected) {
        // Send via WebSocket
        chatService.sendMessageViaWebSocket(request);
      } else {
        // Fallback to REST API
        const sentMessage = await chatService.sendMessage(request);

        // Replace optimistic message with real one
        setMessages(prev => prev.map(msg =>
          msg.messageId === tempMessageId ? sentMessage : msg
        ));
      }

      // Update supplier's last message time
      setSuppliers(prev => prev.map(s =>
        s.userId === selectedSupplier.userId
          ? { ...s, lastMessageTime: new Date().toISOString() }
          : s
      ));
    } catch (error) {
      console.error('Failed to send message:', error);

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.messageId !== tempMessageId));

      // Restore input
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

  // Memoized filtered suppliers
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
    if (!currentUserId || message.sender.userId !== currentUserId) return null;

    switch (message.status) {
      case 'SENT':
        return <Circle className="w-3 h-3 text-gray-400" fill="currentColor" />;
      case 'DELIVERED':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'READ':
        return <CheckCheck className="w-3 h-3 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-[#A4C3A2]" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-[#2D2D2D]">Hỗ trợ nhà cung cấp</h1>
                <p className="text-[#6B6B6B] mt-1">
                  Trò chuyện và hỗ trợ các nhà cung cấp • {isConnected ? (
                    <span className="text-green-600 font-medium">Đang kết nối</span>
                  ) : (
                    <span className="text-red-600 font-medium">Mất kết nối</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 bg-white rounded-xl shadow-sm border border-[#DDC6B6] overflow-hidden min-h-0">
          {/* Suppliers Sidebar */}
          <div className="w-80 border-r border-[#DDC6B6] flex flex-col">
            {/* Search Header */}
            <div className="p-4 border-b border-[#DDC6B6] bg-[#F8FFF9]">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#E8FFED] rounded-lg">
                  <Users className="w-5 h-5 text-[#2F855A]" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-[#2D2D2D]">Nhà cung cấp</h2>
                  <p className="text-sm text-[#6B6B6B]">{filteredSuppliers.length} đối tác</p>
                </div>
                <button
                  onClick={loadSuppliers}
                  disabled={loadingSuppliers}
                  className="p-2 hover:bg-[#E8FFED] rounded-lg transition-colors disabled:opacity-50"
                  title="Làm mới"
                >
                  <RefreshCw className={`w-4 h-4 text-[#2F855A] ${loadingSuppliers ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8B8B8B]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhà cung cấp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 input-field text-sm"
                />
              </div>
            </div>

            {/* Suppliers List */}
            <div className="flex-1 overflow-y-auto bg-white min-h-0">
              {loadingSuppliers ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <RefreshCw className="w-8 h-8 text-[#A4C3A2] animate-spin mb-3" />
                  <p className="text-sm text-[#6B6B6B]">Đang tải danh sách...</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <Users className="w-12 h-12 text-[#DDC6B6] mb-3" />
                  <p className="text-[#6B6B6B] font-medium mb-1">
                    {searchQuery ? 'Không tìm thấy' : 'Chưa có nhà cung cấp'}
                  </p>
                  <p className="text-xs text-[#8B8B8B]">
                    {searchQuery ? 'Thử từ khóa khác' : 'Danh sách trống'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#DDC6B6]">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.userId}
                      onClick={() => handleSupplierClick(supplier)}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedSupplier?.userId === supplier.userId
                          ? 'bg-[#E8FFED] border-l-4 border-l-[#2F855A]'
                          : 'hover:bg-[#F8FFF9]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={supplier.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(supplier.businessName || supplier.fullName)}&background=A4C3A2&color=fff`}
                            alt={supplier.businessName || supplier.fullName}
                            className="w-11 h-11 rounded-lg object-cover border-2 border-[#E8FFED]"
                          />
                          {supplier.unreadCount && supplier.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-semibold text-[10px] px-1">
                              {supplier.unreadCount > 9 ? '9+' : supplier.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-0.5">
                            <h3 className={`font-semibold text-sm truncate ${
                              selectedSupplier?.userId === supplier.userId ? 'text-[#2F855A]' : 'text-[#2D2D2D]'
                            }`}>
                              {supplier.businessName || supplier.fullName}
                            </h3>
                            {supplier.lastMessageTime && (
                              <span className="text-xs text-[#8B8B8B] whitespace-nowrap ml-2">
                                {formatTime(supplier.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6B6B6B] truncate">
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
                <div className="p-4 border-b border-[#DDC6B6] bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedSupplier.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSupplier.businessName || selectedSupplier.fullName)}&background=A4C3A2&color=fff`}
                        alt={selectedSupplier.businessName || selectedSupplier.fullName}
                        className="w-11 h-11 rounded-lg object-cover border-2 border-[#E8FFED]"
                      />
                      <div>
                        <h3 className="font-semibold text-[#2D2D2D]">
                          {selectedSupplier.businessName || selectedSupplier.fullName}
                        </h3>
                        <p className="text-sm text-[#6B6B6B]">{selectedSupplier.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => selectedSupplier && loadMessages(selectedSupplier.userId)}
                      disabled={loading}
                      className="p-2 hover:bg-[#E8FFED] rounded-lg transition-colors disabled:opacity-50"
                      title="Làm mới tin nhắn"
                    >
                      <RefreshCw className={`w-4 h-4 text-[#2F855A] ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FFF9] min-h-0"
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-6 h-6 text-[#A4C3A2] animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[#6B6B6B]">
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-[#DDC6B6]" />
                        <p className="font-medium text-sm">Chưa có tin nhắn</p>
                        <p className="text-xs mt-1">Gửi tin nhắn đầu tiên để bắt đầu</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isOwn = message.sender.userId === currentUserId;
                        return (
                          <div
                            key={message.messageId}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                          >
                            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                              <div
                                className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                  isOwn
                                    ? 'bg-[#A4C3A2] text-white'
                                    : 'bg-white text-[#2D2D2D] border border-[#E8FFED]'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {message.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 px-1">
                                <span className="text-xs text-[#8B8B8B]">
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
                <div className="p-4 border-t border-[#DDC6B6] bg-white">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn hỗ trợ..."
                      disabled={sending}
                      className="flex-1 input-field py-2.5 text-sm disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="btn-primary px-5 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Đang gửi...' : 'Gửi'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#F8FFF9] min-h-0">
                <div className="text-center text-[#6B6B6B]">
                  <Users className="w-16 h-16 mx-auto mb-4 text-[#DDC6B6]" />
                  <p className="font-semibold text-[#2D2D2D] mb-1 text-lg">Chọn nhà cung cấp</p>
                  <p className="text-sm">Chọn từ danh sách bên trái để bắt đầu trò chuyện</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
