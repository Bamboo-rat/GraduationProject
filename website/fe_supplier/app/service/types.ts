// Common API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  // Legacy fields for backward compatibility
  code?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

// Spring Data Page response structure
export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: string;
}

// Chat & Messaging Types

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  ORDER_LINK = 'ORDER_LINK'
}

export interface UserInfo {
  userId: string;
  keycloakId: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  avatarUrl: string;
  active: boolean;
  userType: 'CUSTOMER' | 'SUPPLIER' | 'ADMIN';
  status: string;
  roles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  messageId: string;
  content: string;
  sendTime: string;
  sender: UserInfo;
  receiver: UserInfo;
  status: MessageStatus;
  type: MessageType;
  fileUrl?: string;
}

export interface Conversation {
  otherUser: UserInfo;
  lastMessage: ChatMessage;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ChatMessageRequest {
  content: string;
  receiverId: string;
  type?: MessageType;
  fileUrl?: string;
}
