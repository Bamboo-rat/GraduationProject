import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import chatService from '~/service/chatService';
import type { Conversation, ChatMessage } from '~/service/types';
import { MessageType, MessageStatus } from '~/service/types';
import { MessageSquare, Send, Search, User, Circle } from 'lucide-react';
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

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // WebSocket connection
  useEffect(() => {
    let mounted = true;

    const connectWebSocket = async () => {
      try {
        await chatService.connect();
        if (mounted) {
          setIsConnected(true);
          console.log('WebSocket connected successfully');
        }
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    connectWebSocket();

    // Handle incoming messages
    const unsubscribeMessage = chatService.onMessage((message: ChatMessage) => {
      console.log('Received message:', message);

      // Add message to the current conversation if it matches
      if (selectedConversation &&
          (message.sender.userId === selectedConversation.otherUser.userId ||
           message.receiver.userId === selectedConversation.otherUser.userId)) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.messageId === message.messageId)) {
            return prev;
          }
          return [...prev, message];
        });

        // Mark as read if we're the receiver
        if (message.receiver.userId === currentUserRef.current) {
          chatService.markAsReadViaWebSocket(message.messageId);
        }
      }

      // Refresh conversations to update last message
      loadConversations();
    });

    return () => {
      mounted = false;
      unsubscribeMessage();
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
      setMessages(prev => prev.filter(m => m.messageId !== `temp-${Date.now()}`));
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
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'Vừa xong' : `${minutes} phút trước`;
    } else if (hours < 24) {
      return `${hours} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Hỗ trợ khách hàng</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className="text-sm text-gray-600">
                  {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
                </p>
              </div>
            </div>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
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
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {conv.otherUser.avatarUrl ? (
                            <img
                              src={conv.otherUser.avatarUrl}
                              alt={conv.otherUser.fullName || 'User'}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {conv.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium text-gray-900 truncate text-sm">
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
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {selectedConversation.otherUser.avatarUrl ? (
                        <img
                          src={selectedConversation.otherUser.avatarUrl}
                          alt={selectedConversation.otherUser.fullName || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-medium text-gray-900 text-sm">
                        {selectedConversation.otherUser.fullName || selectedConversation.otherUser.email}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {selectedConversation.otherUser.email}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                </div>

                {/* Messages Container */}
                <div 
                  ref={messagesContainerRef}
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
                        <div className={`max-w-[80%] flex ${isSentByMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                          {/* Avatar for received messages */}
                          {!isSentByMe && (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3 text-gray-600" />
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div className={`rounded-2xl px-4 py-2 ${
                            isSentByMe
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                          } ${isTemp ? 'opacity-70' : ''}`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>

                          {/* Time and Status */}
                          <div className={`flex items-center gap-1 text-xs ${
                            isSentByMe ? 'text-blue-500' : 'text-gray-500'
                          }`}>
                            <span>{formatMessageTime(message.sendTime)}</span>
                            {isSentByMe && (
                              <span className="text-xs">
                                {message.status === MessageStatus.READ ? '✓✓' : 
                                 message.status === MessageStatus.DELIVERED ? '✓✓' : 
                                 isTemp ? <Circle className="w-3 h-3 animate-pulse" /> : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-white border-t p-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        rows={1}
                        className="w-full resize-none bg-transparent border-none focus:outline-none text-sm placeholder-gray-500 max-h-32"
                        style={{ minHeight: '20px' }}
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sending}
                      className="bg-blue-500 text-white p-3 rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Chọn một hội thoại để bắt đầu trò chuyện</p>
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
