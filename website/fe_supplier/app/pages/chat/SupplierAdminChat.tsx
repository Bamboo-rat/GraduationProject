import { useState, useEffect, useRef } from 'react';
import chatService from '~/service/chatService';
import type { ChatMessage, Conversation, ChatMessageRequest } from '~/service/types';
import { MessageType } from '~/service/types';
import { Send, Paperclip, Search, MoreVertical, Phone, Video, Smile } from 'lucide-react';

export default function SupplierAdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typing, setTyping] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      chatService.disconnect();
    };
  }, []);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Connect to WebSocket
      await chatService.connect();
      console.log('WebSocket connected');

      // Subscribe to incoming messages
      const unsubscribeMessage = chatService.onMessage((message: ChatMessage) => {
        console.log('New message received:', message);
        setMessages(prev => [...prev, message]);
        
        // Mark as read if conversation is open
        if (selectedConversation?.otherUser.userId === message.sender.userId) {
          chatService.markAsRead(message.messageId);
        }
      });

      // Subscribe to typing indicators
      const unsubscribeTyping = chatService.onTypingIndicator((senderId: string) => {
        setTyping(senderId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
      });

      // Load conversations
      await loadConversations();

      return () => {
        unsubscribeMessage();
        unsubscribeTyping();
      };
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const data = await chatService.getConversation(otherUserId, 0, 50);
      setMessages(data.content.reverse());
      
      // Mark conversation as read
      await chatService.markConversationAsRead(otherUserId);
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.otherUser.userId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedConversation || sending) return;

    const request: ChatMessageRequest = {
      receiverId: selectedConversation.otherUser.userId,
      content: messageInput.trim(),
      type: MessageType.TEXT
    };

    try {
      setSending(true);
      
      // Try WebSocket first, fallback to REST API
      try {
        chatService.sendMessageViaWebSocket(request);
      } catch {
        const message = await chatService.sendMessage(request);
        setMessages(prev => [...prev, message]);
      }
      
      setMessageInput('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (selectedConversation) {
      chatService.sendTypingIndicator(selectedConversation.otherUser.userId);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return messageDate.toLocaleDateString('vi-VN');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-xl shadow-lg overflow-hidden flex">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Hỗ trợ Admin</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-sm">Chưa có cuộc trò chuyện</p>
              <p className="text-xs mt-2">Bắt đầu chat với Admin để nhận hỗ trợ</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.otherUser.userId}
                onClick={() => handleConversationSelect(conv)}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  selectedConversation?.otherUser.userId === conv.otherUser.userId ? 'bg-green-50' : ''
                }`}
              >
                <img
                  src={conv.otherUser.avatarUrl || 'https://via.placeholder.com/40'}
                  alt={conv.otherUser.fullName || conv.otherUser.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {conv.otherUser.fullName || conv.otherUser.username}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conv.lastMessage.content}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedConversation.otherUser.avatarUrl || 'https://via.placeholder.com/40'}
                  alt={selectedConversation.otherUser.fullName || selectedConversation.otherUser.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {selectedConversation.otherUser.fullName || selectedConversation.otherUser.username}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {typing === selectedConversation.otherUser.userId ? 'Đang nhập...' : 'Online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => {
                const isOwn = message.sender.userId !== selectedConversation.otherUser.userId;
                const showDate = index === 0 || 
                  formatDate(messages[index - 1].sendTime) !== formatDate(message.sendTime);

                return (
                  <div key={message.messageId}>
                    {showDate && (
                      <div className="text-center mb-4">
                        <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                          {formatDate(message.sendTime)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-green-600 text-white rounded-br-none'
                              : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <div className={`flex items-center mt-1 space-x-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-500">{formatTime(message.sendTime)}</span>
                          {isOwn && (
                            <span className="text-xs text-gray-500">
                              {message.status === 'READ' ? '✓✓' : message.status === 'DELIVERED' ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Chọn một cuộc trò chuyện</h3>
              <p className="text-gray-600">Chọn admin để bắt đầu nhắn tin và nhận hỗ trợ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
