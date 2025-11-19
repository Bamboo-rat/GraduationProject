import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import chatService from '~/service/chatService';
import type { Conversation, ChatMessage } from '~/service/types';
import { MessageType, MessageStatus } from '~/service/types';
import { MessageSquare, Send, Search, User, Circle, CheckCircle2, CheckCheck, RefreshCw } from 'lucide-react';
import Toast from '~/component/common/Toast';

export default function SupportTickets() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentUserRef = useRef<string | null>(null);
  const isAutoScrollEnabled = useRef(true);

  // Optimized auto-scroll
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

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Get current user ID
  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        currentUserRef.current = user.userId;
      } catch (e) {
        console.error('Failed to parse user info:', e);
      }
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // WebSocket connection với optimized message handling
  useEffect(() => {
    let mounted = true;

    const handleIncomingMessage = (message: ChatMessage) => {
      if (!mounted) return;

      // Check if message belongs to current conversation
      const isForCurrentConversation = selectedConversation &&
        (message.sender.userId === selectedConversation.otherUser.userId ||
         message.receiver.userId === selectedConversation.otherUser.userId);

      if (isForCurrentConversation) {
        setMessages(prev => {
          // Avoid duplicates and update existing messages
          const exists = prev.some(m => m.messageId === message.messageId);
          if (exists) {
            return prev.map(m => m.messageId === message.messageId ? message : m);
          }
          return [...prev, message];
        });

        // Mark as read if we're the receiver
        if (message.receiver.userId === currentUserRef.current && message.status !== MessageStatus.READ) {
          setTimeout(() => {
            chatService.markAsReadViaWebSocket(message.messageId);
          }, 500);
        }
      }

      // Refresh conversations to update last message
      loadConversations();
    };

    const connectWebSocket = async () => {
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

    connectWebSocket();

    return () => {
      mounted = false;
      chatService.disconnect();
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      showToast('Không thể tải danh sách hội thoại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversation: Conversation) => {
    try {
      setSelectedConversation(conversation);
      const response = await chatService.getConversation(conversation.otherUser.userId, 0, 50);

      // Messages come in DESC order (newest first), reverse to show oldest first
      setMessages(response.content.reverse());

      // Mark conversation as read
      await chatService.markConversationAsRead(conversation.otherUser.userId);

      // Refresh conversations to update unread count
      loadConversations();
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      showToast('Không thể tải tin nhắn', 'error');
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sending) return;

    const messageContent = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      // Create temporary message for immediate UI update
      const tempMessage: ChatMessage = {
        messageId: `temp-${Date.now()}`,
        content: messageContent,
        sender: {
          userId: currentUserRef.current!,
          keycloakId: '',
          username: 'admin',
          fullName: 'Admin',
          email: '',
          phoneNumber: '',
          avatarUrl: '',
          active: true,
          userType: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        receiver: selectedConversation.otherUser,
        type: MessageType.TEXT,
        sendTime: new Date().toISOString(),
        status: MessageStatus.SENT
      };

      // Add temporary message to UI immediately
      setMessages(prev => [...prev, tempMessage]);

      // Send via WebSocket if connected, otherwise use REST
      if (isConnected) {
        chatService.sendMessageViaWebSocket({
          content: messageContent,
          receiverId: selectedConversation.otherUser.userId,
          type: MessageType.TEXT
        });
      } else {
        const message = await chatService.sendMessage({
          content: messageContent,
          receiverId: selectedConversation.otherUser.userId,
          type: MessageType.TEXT
        });

        // Replace temporary message with real message
        setMessages(prev => prev.map(m => 
          m.messageId === tempMessage.messageId ? message : m
        ));
      }

      // Refresh conversations to update last message
      loadConversations();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      showToast('Không thể gửi tin nhắn', 'error');
      // Remove temporary message on error
      setMessages(prev => prev.filter(m => !m.messageId.startsWith('temp-')));
      setMessageInput(messageContent); // Restore message
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút`;
    if (hours < 24) return `${hours} giờ`;
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatus = (message: ChatMessage) => {
    const isSentByMe = message.sender.userId === currentUserRef.current;
    const isTemp = message.messageId.startsWith('temp-');

    if (!isSentByMe) return null;

    if (isTemp) {
      return <Circle className="w-3 h-3 text-gray-400 animate-pulse" fill="currentColor" />;
    }

    switch (message.status) {
      case MessageStatus.SENT:
        return <Circle className="w-3 h-3 text-gray-400" fill="currentColor" />;
      case MessageStatus.DELIVERED:
        return <CheckCircle2 className="w-3 h-3 text-gray-400" />;
      case MessageStatus.READ:
        return <CheckCheck className="w-3 h-3 text-green-600" />;
      default:
        return <Circle className="w-3 h-3 text-gray-400" fill="currentColor" />;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-[#A8D5BA]" size={28} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Hỗ trợ khách hàng</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <p className="text-sm text-gray-600">
                    {isConnected ? '🟢 Đang kết nối' : '🔴 Mất kết nối'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={loadConversations}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-80 bg-white border-r flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm hội thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-[#A8D5BA] transition-all"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 text-[#A8D5BA] animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Chưa có hội thoại nào</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.otherUser.userId}
                    onClick={() => loadMessages(conv)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      selectedConversation?.otherUser.userId === conv.otherUser.userId
                        ? 'bg-[#E8F5E9] border-l-4 border-l-[#A8D5BA]'
                        : 'hover:bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                          {conv.otherUser.avatarUrl ? (
                            <img
                              src={conv.otherUser.avatarUrl}
                              alt={conv.otherUser.fullName || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`font-medium truncate text-sm ${
                            selectedConversation?.otherUser.userId === conv.otherUser.userId
                              ? 'text-[#2D7D46]'
                              : 'text-gray-900'
                          }`}>
                            {conv.otherUser.fullName || conv.otherUser.email}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${
                          conv.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                        }`}>
                          {conv.lastMessage.sender.userId === currentUserRef.current && 'Bạn: '}
                          {conv.lastMessage.content}
                        </p>
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
                <div className="bg-white border-b px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                        {selectedConversation.otherUser.avatarUrl ? (
                          <img
                            src={selectedConversation.otherUser.avatarUrl}
                            alt={selectedConversation.otherUser.fullName || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="font-semibold text-gray-900">
                          {selectedConversation.otherUser.fullName || selectedConversation.otherUser.email}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.otherUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-xs text-gray-500">
                        {isConnected ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
                >
                  {messages.map((message) => {
                    const isSentByMe = message.sender.userId === currentUserRef.current;
                    const isTemp = message.messageId.startsWith('temp-');

                    return (
                      <div
                        key={message.messageId}
                        className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isSentByMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isSentByMe
                                ? 'bg-[#A8D5BA] text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            } ${isTemp ? 'opacity-80' : ''}`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          <div className="flex items-center gap-1.5 px-1 mt-1">
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.sendTime)}
                            </span>
                            {getMessageStatus(message)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-white border-t p-4">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 bg-gray-100 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-[#A8D5BA] focus-within:bg-white transition-all">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        className="w-full bg-transparent border-none focus:outline-none text-sm placeholder-gray-500"
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="bg-[#A8D5BA] text-white p-3 rounded-xl hover:bg-[#8BBF9E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {sending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Chọn một hội thoại</p>
                  <p className="text-sm">Chọn từ danh sách để bắt đầu trò chuyện</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}