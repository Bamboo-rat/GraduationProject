// Common API Response Types

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
    sort?: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
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

export interface ErrorResponse {
  code: string;
  message: string;
  vietnameseMessage: string;
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
