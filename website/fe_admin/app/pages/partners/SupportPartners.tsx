import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageSquare, Users, RefreshCw, Circle, CheckCheck } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const selectedSupplierRef = useRef<SupplierWithUnread | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedSupplierRef.current = selectedSupplier;
  }, [selectedSupplier]);

  // Improved auto-scroll function
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Also scroll when supplier changes (new conversation)
  useEffect(() => {
    if (selectedSupplier) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [selectedSupplier]);

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

      const unsubscribeMessage = chatService.onMessage((message: ChatMessage) => {
        const current = selectedSupplierRef.current;
        
        if (current && current.userId &&
            (message.sender.userId === current.userId || 
             message.receiver.userId === current.userId)) {
          
          setMessages(prev => {
            const isDuplicate = prev.some(msg => 
              msg.messageId === message.messageId ||
              (msg.content === message.content &&
               msg.sender.userId === message.sender.userId &&
               Math.abs(new Date(msg.sendTime).getTime() - new Date(message.sendTime).getTime()) < 5000)
            );
            
            if (isDuplicate) {
              return prev.map(msg => 
                (msg.messageId.startsWith('temp-') && 
                 msg.content === message.content &&
                 msg.sender.userId === message.sender.userId)
                  ? message 
                  : msg
              );
            }
            
            return [...prev, message];
          });
          
          if (message.receiver.userId === currentUserId) {
            chatService.markAsRead(message.messageId);
          }
        } else {
          setSuppliers(prev => prev.map(s => {
            if (s.userId === message.sender.userId) {
              return {
                ...s,
                unreadCount: (s.unreadCount || 0) + 1,
                lastMessageTime: message.sendTime
              };
            }
            return s;
          }));
        }
      });

      return () => {
        unsubscribeMessage();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await supplierService.getAllSuppliers(0, 100, undefined, '', 'businessName', 'ASC');
      const suppliersData = response.content;

      const conversations = await chatService.getConversations();
      
      const suppliersWithUnread: SupplierWithUnread[] = suppliersData.map(supplier => {
        const conv = conversations.find(c => c.otherUser.userId === supplier.userId);
        return {
          ...supplier,
          unreadCount: conv?.unreadCount || 0,
          lastMessageTime: conv?.lastMessageTime
        };
      });

      suppliersWithUnread.sort((a, b) => {
        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        }
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        return a.businessName.localeCompare(b.businessName);
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

      await chatService.markConversationAsRead(supplierId);
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

  const handleSupplierClick = (supplier: SupplierWithUnread) => {
    setSelectedSupplier(supplier);
    loadMessages(supplier.userId);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedSupplier || !currentUserId || !user) return;

    const request: ChatMessageRequest = {
      content: messageInput.trim(),
      receiverId: selectedSupplier.userId,
      type: 'TEXT' as any,
    };

    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      messageId: tempMessageId,
      content: request.content,
      sendTime: new Date().toISOString(),
      sender: {
        userId: currentUserId,
        keycloakId: user.keycloakId || '',
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        fullName: user.fullName || 'Bạn',
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
        fullName: selectedSupplier.businessName,
        avatarUrl: selectedSupplier.avatarUrl || '',
        active: selectedSupplier.active,
        userType: 'SUPPLIER',
        status: selectedSupplier.status || 'ACTIVE',
        createdAt: selectedSupplier.createdAt || '',
        updatedAt: selectedSupplier.updatedAt || ''
      },
      status: 'SENT' as any,
      type: 'TEXT' as any
    };

    try {
      setMessages(prev => [...prev, optimisticMessage]);
      setMessageInput('');
      
      // Scroll immediately after adding optimistic message
      setTimeout(() => {
        scrollToBottom();
      }, 0);

      if (isConnected) {
        try {
          chatService.sendMessageViaWebSocket(request);
        } catch (wsError) {
          console.error('WebSocket send failed:', wsError);
          setMessages(prev => prev.filter(msg => msg.messageId !== tempMessageId));
          const message = await chatService.sendMessage(request);
          setMessages(prev => [...prev, message]);
        }
      } else {
        setMessages(prev => prev.filter(msg => msg.messageId !== tempMessageId));
        const message = await chatService.sendMessage(request);
        setMessages(prev => [...prev, message]);
      }
      
      setSuppliers(prev => prev.map(s =>
        s.userId === selectedSupplier.userId
          ? { ...s, lastMessageTime: new Date().toISOString() }
          : s
      ));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg.messageId !== tempMessageId));
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
    if (!currentUserId || message.sender.userId !== currentUserId) return null;

    switch (message.status) {
      case 'SENT':
        return <Circle className="w-3 h-3 text-[#8B8B8B]" />;
      case 'DELIVERED':
        return <CheckCheck className="w-3 h-3 text-[#8B8B8B]" />;
      case 'READ':
        return <CheckCheck className="w-3 h-3 text-[#2F855A]" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="text-[#A4C3A2]" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-[#2D2D2D]">Hỗ trợ Nhà cung cấp</h1>
              <p className="text-[#6B6B6B] mt-1">Trò chuyện và hỗ trợ các nhà cung cấp</p>
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
                  className="p-2 hover:bg-[#E8FFED] rounded-lg transition-colors"
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

            {/* Suppliers List - Fixed height với scrolling nội bộ */}
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
                          ? 'bg-[#E8FFED] border-r-2 border-r-[#2F855A]'
                          : 'hover:bg-[#F8FFF9]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={supplier.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(supplier.businessName || supplier.fullName)}&background=A4C3A2&color=fff`}
                            alt={supplier.businessName || supplier.fullName}
                            className="w-10 h-10 rounded-lg object-cover border border-[#E8FFED]"
                          />
                          {supplier.unreadCount && supplier.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[#E63946] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold text-[10px]">
                              {supplier.unreadCount > 9 ? '9+' : supplier.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className={`font-medium text-sm truncate ${
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
                        className="w-10 h-10 rounded-lg object-cover border border-[#E8FFED]"
                      />
                      <div>
                        <h3 className="font-semibold text-[#2D2D2D]">{selectedSupplier.businessName || selectedSupplier.fullName}</h3>
                        <p className="text-sm text-[#6B6B6B]">{selectedSupplier.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => loadMessages(selectedSupplier.userId)}
                      className="p-2 hover:bg-[#E8FFED] rounded-lg transition-colors"
                      title="Làm mới tin nhắn"
                    >
                      <RefreshCw className={`w-4 h-4 text-[#2F855A] ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Messages - Fixed height với scrolling nội bộ */}
                <div 
                  ref={messagesContainerRef}
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
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                              <div
                                className={`px-3 py-2 rounded-2xl ${
                                  isOwn
                                    ? 'bg-[#A4C3A2] text-white'
                                    : 'bg-white text-[#2D2D2D] shadow-sm border border-[#E8FFED]'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                              <div className="flex items-center gap-2 px-1">
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn hỗ trợ..."
                      className="flex-1 input-field py-2 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="btn-primary px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Send className="w-4 h-4" />
                      Gửi
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#F8FFF9] min-h-0">
                <div className="text-center text-[#6B6B6B]">
                  <Users className="w-16 h-16 mx-auto mb-3 text-[#DDC6B6]" />
                  <p className="font-medium text-[#2D2D2D] mb-1 text-sm">Chọn nhà cung cấp</p>
                  <p className="text-xs">Chọn từ danh sách để bắt đầu trò chuyện</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}