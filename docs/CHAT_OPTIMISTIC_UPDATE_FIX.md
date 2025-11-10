# Chat Optimistic Update Fix

## Vấn đề
Chat phải reload mới thấy tin nhắn & không tự cuộn xuống. Khi gửi tin nhắn qua WebSocket, tin nhắn không hiển thị ngay lập tức trên UI, người dùng phải chờ server trả về hoặc reload trang.

## Nguyên nhân
- Khi `isConnected === true`, code gọi `sendMessageViaWebSocket()` nhưng không thêm tin nhắn vào UI
- Chỉ khi fallback sang REST API (`isConnected === false`) mới thêm tin nhắn vào `messages` state
- WebSocket listener sẽ thêm tin nhắn khi server echo lại, nhưng nếu có độ trễ hoặc mất kết nối thì tin nhắn không xuất hiện

## Giải pháp - Optimistic Update

### 1. Thêm tin nhắn tạm thời ngay lập tức (Optimistic Message)
```typescript
// Tạo tin nhắn tạm với ID duy nhất
const tempMessageId = `temp-${Date.now()}`;
const optimisticMessage: ChatMessage = {
  messageId: tempMessageId,
  content: request.content,
  sendTime: new Date().toISOString(),
  sender: { ...currentUser },
  receiver: { ...selectedSupplier },
  status: 'SENT',
  type: 'TEXT'
};

// Thêm vào UI ngay lập tức
setMessages(prev => [...prev, optimisticMessage]);
setMessageInput('');

// Auto-scroll ngay sau khi thêm
setTimeout(() => scrollToBottom(), 50);
```

### 2. Gửi tin nhắn qua WebSocket với error handling
```typescript
if (isConnected) {
  try {
    chatService.sendMessageViaWebSocket(request);
  } catch (wsError) {
    console.error('WebSocket send failed, falling back to REST:', wsError);
    // Xóa tin nhắn tạm nếu WebSocket fail
    setMessages(prev => prev.filter(msg => msg.messageId !== tempMessageId));
    
    // Fallback sang REST API
    const message = await chatService.sendMessage(request);
    setMessages(prev => [...prev, message]);
  }
}
```

### 3. Cải thiện WebSocket listener - Tránh duplicate messages
```typescript
chatService.onMessage((message: ChatMessage) => {
  setMessages(prev => {
    // Kiểm tra tin nhắn trùng (cùng content, sender, trong vòng 5s)
    const isDuplicate = prev.some(msg => 
      msg.messageId === message.messageId ||
      (msg.content === message.content &&
       msg.sender.userId === message.sender.userId &&
       Math.abs(new Date(msg.sendTime).getTime() - new Date(message.sendTime).getTime()) < 5000)
    );
    
    if (isDuplicate) {
      // Thay thế tin nhắn tạm bằng tin nhắn thật từ server
      return prev.map(msg => 
        (msg.messageId.startsWith('temp-') && 
         msg.content === message.content &&
         msg.sender.userId === message.sender.userId)
          ? message 
          : msg
      );
    }
    
    return [...prev, message]; // Thêm tin nhắn mới
  });
});
```

### 4. Xử lý lỗi - Xóa tin nhắn tạm nếu gửi thất bại
```typescript
try {
  // ... send logic
} catch (error) {
  console.error('Failed to send message:', error);
  // Xóa tin nhắn tạm khi gặp lỗi
  setMessages(prev => prev.filter(msg => msg.messageId !== tempMessageId));
  // TODO: Hiển thị toast/notification lỗi cho user
}
```

## Luồng hoạt động mới

### Trường hợp 1: WebSocket hoạt động tốt
1. User gửi tin nhắn
2. **Tin nhắn tạm xuất hiện ngay lập tức** (optimistic update)
3. Auto-scroll xuống cuối
4. Gửi qua WebSocket
5. Server echo lại tin nhắn
6. **Thay thế tin nhắn tạm bằng tin nhắn thật** (với messageId từ server)

### Trường hợp 2: WebSocket chậm/lỗi
1. User gửi tin nhắn
2. **Tin nhắn tạm xuất hiện ngay lập tức**
3. Auto-scroll xuống cuối
4. Gửi qua WebSocket - **thất bại**
5. **Xóa tin nhắn tạm**
6. **Fallback sang REST API**
7. Thêm tin nhắn từ REST response

### Trường hợp 3: WebSocket disconnected
1. User gửi tin nhắn
2. **Tin nhắn tạm xuất hiện ngay lập tức**
3. Auto-scroll xuống cuối
4. **Xóa tin nhắn tạm**
5. **Gửi qua REST API** (vì `isConnected === false`)
6. Thêm tin nhắn từ REST response

## Files thay đổi

### `website/fe_admin/app/pages/partners/SupportPartners.tsx`
- **handleSendMessage()**: Thêm optimistic update logic
- **WebSocket listener**: Cải thiện duplicate detection và message replacement
- **Error handling**: Xóa optimistic message khi có lỗi

## Lợi ích
✅ **UX tốt hơn**: Tin nhắn hiển thị ngay lập tức, không phải đợi server  
✅ **Auto-scroll hoạt động**: Scroll ngay sau khi thêm tin nhắn tạm  
✅ **Xử lý lỗi tốt**: Fallback sang REST nếu WebSocket fail  
✅ **Tránh duplicate**: Thay thế tin nhắn tạm bằng tin thật từ server  
✅ **Reliable**: Không mất tin nhắn khi WebSocket chậm/lỗi  

## Testing checklist
- [ ] Gửi tin nhắn khi WebSocket connected - tin nhắn xuất hiện ngay
- [ ] Gửi tin nhắn khi WebSocket disconnected - fallback REST API hoạt động
- [ ] Auto-scroll xuống cuối sau khi gửi tin nhắn
- [ ] Không có duplicate messages khi server echo lại
- [ ] Tin nhắn tạm bị xóa nếu gửi thất bại
- [ ] Fallback sang REST khi WebSocket error

## Notes
- Supplier chat components (`CustomerSupport.tsx`, `SupplierAdminChat.tsx`) đã có optimistic update từ trước
- Chỉ cần fix admin chat component (`SupportPartners.tsx`)
- Có thể thêm toast notification để thông báo lỗi cho user (TODO)
