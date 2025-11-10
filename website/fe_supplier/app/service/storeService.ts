import apiClient from '~/config/axios';
import type { ApiResponse, PaginatedResponse } from './types';
import type { ProductImageResponse } from './productService';

// ============= TYPES =============

export type StoreStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED' | 'UNDER_MAINTENANCE';

export interface StoreResponse {
  storeId: string;
  storeName: string;
  description?: string;
  address: string;
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber: string;
  imageUrl?: string;
  openTime?: string;
  closeTime?: string;
  status?: StoreStatus | string;
  supplierId?: string;
  supplierName?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  // ...other fields as needed
}

export interface StoreCreateRequest {
  storeName: string;
  address: string;
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  phoneNumber: string;
  description?: string;
  imageUrl?: string;
  openTime?: string;
  closeTime?: string;
  latitude?: number;
  longitude?: number;
}

export interface StoreUpdateRequest {
  storeName?: string;
  address?: string;
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  phoneNumber?: string;
  description?: string;
  imageUrl?: string;
  openTime?: string;
  closeTime?: string;
  latitude?: number;
  longitude?: number;
}

export interface StoreUpdateResponse {
  updateType: 'IMMEDIATE' | 'PENDING';
  message: string;
  store?: StoreResponse;
  pendingUpdate?: StorePendingUpdateResponse;
}

export interface StorePendingUpdateResponse {
  updateId: string;
  // Store info
  storeId: string;
  currentStoreName?: string;
  // Pending update fields (only set when requested)
  storeName?: string;
  address?: string;
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  phoneNumber?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  openTime?: string;
  closeTime?: string;
  status?: string;
  // Update metadata
  updateStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
  // Admin info
  adminId?: string;
  adminName?: string;
}

export interface StoreProductVariantResponse {
  productId: string;
  productName: string;
  categoryName: string;
  variantId: string;
  variantName: string;
  sku: string;
  originalPrice: number;
  discountPrice?: number;
  expiryDate: string;
  isAvailable: boolean;
  variantImages: ProductImageResponse[];
  stockQuantity: number;
  priceOverride?: number;
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
   * Get all stores for current supplier (simple array, no pagination)
   * Useful for dropdowns and quick access
   */
  async getStoreBySupplier(): Promise<StoreResponse[]> {
    try {
      const response = await this.getMyStores({ page: 0, size: 100 });
      return response.content;
    } catch (error: any) {
      console.error('Error fetching supplier stores:', error);
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
   * Update store operational status (Supplier only)
   * Endpoint: PATCH /api/stores/{id}/status
   * Allowed transitions:
   * - ACTIVE <-> TEMPORARILY_CLOSED (temporary pause)
   * - ACTIVE <-> UNDER_MAINTENANCE (maintenance mode)
   * - ACTIVE/TEMPORARILY_CLOSED/UNDER_MAINTENANCE -> PERMANENTLY_CLOSED (close business)
   */
  async updateStoreStatus(storeId: string, newStatus: StoreStatus, reason?: string): Promise<StoreResponse> {
    try {
      const response = await apiClient.patch<ApiResponse<StoreResponse>>(
        `${this.BASE_URL}/${storeId}/status`,
        null,
        {
          params: {
            newStatus,
            reason,
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating store status:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái cửa hàng');
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

  /**
   * Get all product variants available at a specific store (Public access)
   * Returns detailed variant-level data with stock information for each variant
   * Only returns data for ACTIVE stores
   * Valid sort fields: createdAt, updatedAt, stockQuantity, priceOverride
   * Endpoint: GET /api/stores/{id}/products
   */
  async getStoreProductVariants(
    storeId: string,
    params: {
      page?: number;
      size?: number;
      sortBy?: string;
      sortDirection?: 'ASC' | 'DESC';
    }
  ): Promise<PageResponse<StoreProductVariantResponse>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<StoreProductVariantResponse>>>(
        `${this.BASE_URL}/${storeId}/products`,
        {
          params: {
            page: params.page || 0,
            size: params.size || 20,
            sortBy: params.sortBy || 'createdAt',
            sortDirection: params.sortDirection || 'DESC',
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching store product variants:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách biến thể sản phẩm');
    }
  }

  /**
   * Get all product variants for a store for inventory management (Supplier only)
   * Returns detailed variant-level data with stock information for each variant
   * Works for stores in ANY status (PENDING, ACTIVE, SUSPENDED, REJECTED, etc.)
   * Suppliers need to manage inventory regardless of store approval status
   * Valid sort fields: createdAt, updatedAt, stockQuantity, priceOverride
   * Endpoint: GET /api/stores/{id}/products/manage
   */
  async getStoreProductVariantsForManagement(
    storeId: string,
    params: {
      page?: number;
      size?: number;
      sortBy?: string;
      sortDirection?: 'ASC' | 'DESC';
    }
  ): Promise<PageResponse<StoreProductVariantResponse>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<StoreProductVariantResponse>>>(
        `${this.BASE_URL}/${storeId}/products/manage`,
        {
          params: {
            page: params.page || 0,
            size: params.size || 20,
            sortBy: params.sortBy || 'createdAt',
            sortDirection: params.sortDirection || 'DESC',
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching store product variants for management:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách biến thể sản phẩm');
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
      SUSPENDED: 'Bị cấm',
      REJECTED: 'Bị từ chối',
      TEMPORARILY_CLOSED: 'Tạm đóng cửa',
      PERMANENTLY_CLOSED: 'Đóng cửa vĩnh viễn',
      UNDER_MAINTENANCE: 'Đang bảo trì',
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
      TEMPORARILY_CLOSED: 'bg-orange-100 text-orange-800',
      PERMANENTLY_CLOSED: 'bg-gray-900 text-white',
      UNDER_MAINTENANCE: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format full address
   */
  formatFullAddress(store: StoreResponse): string {
    const parts = [store.address, store.street, store.ward, store.district, store.province].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Check if store update requires admin approval
   * FIX: Include street, ward, district, province in major fields check
   */
  requiresApproval(changes: StoreUpdateRequest): boolean {
    // Major fields that require approval (align with backend rules)
    const majorFields = ['storeName', 'address', 'street', 'ward', 'district', 'province', 'phoneNumber', 'latitude', 'longitude'];
    return majorFields.some((field) => changes[field as keyof StoreUpdateRequest] !== undefined);
  }
}

const storeService = new StoreService();
export { storeService };
export default storeService;
