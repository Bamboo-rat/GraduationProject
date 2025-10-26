import apiClient from '~/config/axios';
import type { ApiResponse, PaginatedResponse } from './types';

// ============= TYPES =============

export type StoreStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface StoreResponse {
  storeId: string;
  name: string;
  description?: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phoneNumber: string;
  email?: string;
  imageUrls?: string[];
  openingHours?: string;
  status: StoreStatus;
  supplierId: string;
  supplierName?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreCreateRequest {
  name: string;
  description?: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phoneNumber: string;
  email?: string;
  imageUrls?: string[];
  openingHours?: string;
}

export interface StoreUpdateRequest {
  name?: string;
  description?: string;
  address?: string;
  ward?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  email?: string;
  imageUrls?: string[];
  openingHours?: string;
}

export interface StoreUpdateResponse {
  updateType: 'IMMEDIATE' | 'PENDING_APPROVAL';
  message: string;
  store?: StoreResponse;
  pendingUpdate?: StorePendingUpdateResponse;
}

export interface StorePendingUpdateResponse {
  updateId: string;
  storeId: string;
  storeName: string;
  supplierId: string;
  supplierName?: string;
  requestedChanges: {
    name?: string;
    description?: string;
    address?: string;
    ward?: string;
    district?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    phoneNumber?: string;
    email?: string;
    imageUrls?: string[];
    openingHours?: string;
  };
  currentValues: {
    name?: string;
    description?: string;
    address?: string;
    ward?: string;
    district?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    phoneNumber?: string;
    email?: string;
    imageUrls?: string[];
    openingHours?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requiresApproval: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Type alias for backward compatibility
export type StorePendingUpdate = StorePendingUpdateResponse;

export interface StoreUpdateListParams {
  page?: number;
  size?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ============= SERVICE CLASS =============

/**
 * Store Service for Supplier Portal
 * Handles supplier's store management operations
 */
class StoreService {
  private readonly BASE_URL = '/stores';

  /**
   * Get all stores for current supplier (with pagination and filters)
   * Endpoint: GET /api/stores/my-stores
   */
  async getMyStores(params: {
    page?: number;
    size?: number;
    status?: StoreStatus;
    search?: string;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
  }): Promise<PageResponse<StoreResponse>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<StoreResponse>>>(
        `${this.BASE_URL}/my-stores`,
        {
          params: {
            page: params.page || 0,
            size: params.size || 20,
            status: params.status,
            search: params.search,
            sortBy: params.sortBy || 'createdAt',
            sortDirection: params.sortDirection || 'DESC',
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching my stores:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách cửa hàng');
    }
  }

  /**
   * Get store by ID
   * Endpoint: GET /api/stores/{id}
   */
  async getStoreById(storeId: string): Promise<StoreResponse> {
    try {
      const response = await apiClient.get<ApiResponse<StoreResponse>>(
        `${this.BASE_URL}/${storeId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching store:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin cửa hàng');
    }
  }

  /**
   * Create new store
   * Endpoint: POST /api/stores
   * Store will be in PENDING status and requires admin approval
   */
  async createStore(data: StoreCreateRequest): Promise<StoreResponse> {
    try {
      const response = await apiClient.post<ApiResponse<StoreResponse>>(
        this.BASE_URL,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating store:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo cửa hàng');
    }
  }

  /**
   * Update store information
   * Endpoint: PUT /api/stores/{id}
   * Minor changes (description, images, hours) are applied immediately.
   * Major changes (name, address, location) require admin approval.
   */
  async updateStore(storeId: string, data: StoreUpdateRequest): Promise<StoreUpdateResponse> {
    try {
      const response = await apiClient.put<ApiResponse<StoreUpdateResponse>>(
        `${this.BASE_URL}/${storeId}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating store:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật cửa hàng');
    }
  }

  /**
   * Get pending updates for a specific store
   * Endpoint: GET /api/stores/{storeId}/pending-updates
   */
  async getPendingUpdatesByStore(
    storeId: string,
    params: {
      page?: number;
      size?: number;
    }
  ): Promise<PageResponse<StorePendingUpdateResponse>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<StorePendingUpdateResponse>>>(
        `${this.BASE_URL}/${storeId}/pending-updates`,
        {
          params: {
            page: params.page || 0,
            size: params.size || 20,
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching store pending updates:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách yêu cầu cập nhật');
    }
  }

  /**
   * Get pending update by ID
   * Endpoint: GET /api/stores/pending-updates/{id}
   */
  async getPendingUpdateById(updateId: string): Promise<StorePendingUpdateResponse> {
    try {
      const response = await apiClient.get<ApiResponse<StorePendingUpdateResponse>>(
        `${this.BASE_URL}/pending-updates/${updateId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching pending update:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin yêu cầu cập nhật');
    }
  }

  /**
   * Get all pending updates for current supplier (across all stores)
   * Endpoint: GET /api/stores/my-pending-updates
   */
  async getMyPendingUpdates(params: StoreUpdateListParams): Promise<PageResponse<StorePendingUpdateResponse>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<StorePendingUpdateResponse>>>(
        `${this.BASE_URL}/my-pending-updates`,
        {
          params: {
            page: params.page || 0,
            size: params.size || 20,
            status: params.status,
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching my pending updates:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách yêu cầu cập nhật');
    }
  }

  // ============= UTILITY METHODS =============

  /**
   * Get store status label in Vietnamese
   */
  getStatusLabel(status: StoreStatus): string {
    const labels: Record<StoreStatus, string> = {
      PENDING: 'Chờ duyệt',
      ACTIVE: 'Hoạt động',
      SUSPENDED: 'Tạm ngừng',
      REJECTED: 'Bị từ chối',
    };
    return labels[status] || status;
  }

  /**
   * Get store status color class for badges
   */
  getStatusColorClass(status: StoreStatus): string {
    const colors: Record<StoreStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      REJECTED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format full address
   */
  formatFullAddress(store: StoreResponse): string {
    const parts = [store.address, store.ward, store.district, store.city].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Check if store update requires admin approval
   */
  requiresApproval(changes: StoreUpdateRequest): boolean {
    // Major fields that require approval
    const majorFields = ['name', 'address', 'ward', 'district', 'city', 'latitude', 'longitude'];
    return majorFields.some((field) => changes[field as keyof StoreUpdateRequest] !== undefined);
  }
}

export default new StoreService();
