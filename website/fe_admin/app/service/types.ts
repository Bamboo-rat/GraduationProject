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
