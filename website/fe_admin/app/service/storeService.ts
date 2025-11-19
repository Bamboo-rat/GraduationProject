import axiosInstance from '../config/axios';
import type { ApiResponse, PageResponse } from './types';

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
  status: string; // PENDING, ACTIVE, SUSPENDED, REJECTED
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

export interface StorePendingUpdateResponse {
  updateId: string;
  storeId: string;
  currentStoreName: string;
  supplierId: string;
  supplierName?: string;

  // Requested changes (new values)
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

/**
 * Store Service for Admin Portal
 * Handles admin operations for managing stores and pending updates
 */
class StoreService {
  /**
   * Get store by ID
   */
  async getStoreById(storeId: string): Promise<StoreResponse> {
    const response = await axiosInstance.get<ApiResponse<StoreResponse>>(`/stores/${storeId}`);
    return response.data.data;
  }

  /**
   * Get all stores with pagination and filters (admin view)
   */
  async getAllStores(params: {
    page?: number;
    size?: number;
    status?: string;
    supplierId?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
  }): Promise<PageResponse<StoreResponse>> {
    const response = await axiosInstance.get<ApiResponse<PageResponse<StoreResponse>>>('/stores', {
      params: {
        page: params.page || 0,
        size: params.size || 20,
        status: params.status,
        supplierId: params.supplierId,
        search: params.search,
        sortBy: params.sortBy || 'createdAt',
        sortDirection: params.sortDirection || 'DESC',
      },
    });
    return response.data.data;
  }

  /**
   * Approve pending store (Admin only)
   */
  async approveStore(storeId: string, adminNotes?: string): Promise<StoreResponse> {
    const response = await axiosInstance.patch<ApiResponse<StoreResponse>>(
      `/stores/${storeId}/approve`,
      null,
      { params: { adminNotes } }
    );
    return response.data.data;
  }

  /**
   * Reject pending store (Admin only)
   */
  async rejectStore(storeId: string, adminNotes: string): Promise<StoreResponse> {
    const response = await axiosInstance.patch<ApiResponse<StoreResponse>>(
      `/stores/${storeId}/reject`,
      null,
      { params: { adminNotes } }
    );
    return response.data.data;
  }

  /**
   * Suspend active store (Admin only)
   */
  async suspendStore(storeId: string, reason: string): Promise<StoreResponse> {
    const response = await axiosInstance.patch<ApiResponse<StoreResponse>>(
      `/stores/${storeId}/suspend`,
      null,
      { params: { reason } }
    );
    return response.data.data;
  }

  /**
   * Unsuspend suspended store (Admin only)
   */
  async unsuspendStore(storeId: string, adminNotes?: string): Promise<StoreResponse> {
    const response = await axiosInstance.patch<ApiResponse<StoreResponse>>(
      `/stores/${storeId}/unsuspend`,
      null,
      { params: { adminNotes } }
    );
    return response.data.data;
  }

  /**
   * Get all pending store updates (Super Admin only)
   */
  async getAllPendingUpdates(params: {
    page?: number;
    size?: number;
    status?: string;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
  }): Promise<PageResponse<StorePendingUpdateResponse>> {
    const response = await axiosInstance.get<ApiResponse<PageResponse<StorePendingUpdateResponse>>>(
      '/stores/pending-updates',
      {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          status: params.status,
          sortBy: params.sortBy || 'createdAt',
          sortDirection: params.sortDirection || 'DESC',
        },
      }
    );
    return response.data.data;
  }

  /**
   * Get pending update by ID
   */
  async getPendingUpdateById(updateId: string): Promise<StorePendingUpdateResponse> {
    const response = await axiosInstance.get<ApiResponse<StorePendingUpdateResponse>>(
      `/stores/pending-updates/${updateId}`
    );
    return response.data.data;
  }

  /**
   * Get pending updates for a specific store
   */
  async getPendingUpdatesByStore(
    storeId: string,
    params: {
      page?: number;
      size?: number;
    }
  ): Promise<PageResponse<StorePendingUpdateResponse>> {
    const response = await axiosInstance.get<ApiResponse<PageResponse<StorePendingUpdateResponse>>>(
      `/stores/${storeId}/pending-updates`,
      {
        params: {
          page: params.page || 0,
          size: params.size || 20,
        },
      }
    );
    return response.data.data;
  }

  /**
   * Approve store update (Super Admin only)
   */
  async approveStoreUpdate(updateId: string, adminNotes?: string): Promise<StorePendingUpdateResponse> {
    const response = await axiosInstance.patch<ApiResponse<StorePendingUpdateResponse>>(
      `/stores/pending-updates/${updateId}/approve`,
      null,
      { params: { adminNotes } }
    );
    return response.data.data;
  }

  /**
   * Reject store update (Super Admin only)
   */
  async rejectStoreUpdate(updateId: string, adminNotes: string): Promise<StorePendingUpdateResponse> {
    const response = await axiosInstance.patch<ApiResponse<StorePendingUpdateResponse>>(
      `/stores/pending-updates/${updateId}/reject`,
      null,
      { params: { adminNotes } }
    );
    return response.data.data;
  }
}

export default new StoreService();
