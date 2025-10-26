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

export interface ErrorResponse {
  code: string;
  message: string;
  details?: string;
}
