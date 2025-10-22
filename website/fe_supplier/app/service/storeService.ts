import apiClient from '~/config/axios';
import type { ApiResponse, PaginatedResponse } from './types';

export interface Store {
  id: number;
  supplierId: string;
  storeName: string;
  address: string;
  phoneNumber: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StorePendingUpdate {
  id: number;
  storeId: number;
  supplierId: string;
  newStoreName?: string;
  newAddress?: string;
  newPhoneNumber?: string;
  newDescription?: string;
  newLatitude?: number;
  newLongitude?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  processedBy?: string;
  processorName?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Include current store info for display
  currentStoreName?: string;
  currentAddress?: string;
  currentPhoneNumber?: string;
  currentDescription?: string;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface SubmitStoreUpdateRequest {
  newStoreName?: string;
  newAddress?: string;
  newPhoneNumber?: string;
  newDescription?: string;
  newLatitude?: number;
  newLongitude?: number;
}

export interface StoreUpdateListParams {
  page?: number;
  size?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

class StoreService {
  private readonly BASE_URL = '/stores';

  // Get my store info
  async getMyStore(): Promise<Store> {
    const response = await apiClient.get<ApiResponse<Store>>(`${this.BASE_URL}/my-store`);
    return response.data.data;
  }

  // Submit store update request
  async submitStoreUpdate(data: SubmitStoreUpdateRequest): Promise<StorePendingUpdate> {
    const response = await apiClient.post<ApiResponse<StorePendingUpdate>>(
      `${this.BASE_URL}/pending-updates`,
      data
    );
    return response.data.data;
  }

  // Get my pending updates
  async getMyPendingUpdates(params?: StoreUpdateListParams): Promise<PaginatedResponse<StorePendingUpdate>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<StorePendingUpdate>>>(
      `${this.BASE_URL}/pending-updates/my-updates`,
      { params }
    );
    return response.data.data;
  }

  // Get pending update by ID
  async getPendingUpdateById(id: number): Promise<StorePendingUpdate> {
    const response = await apiClient.get<ApiResponse<StorePendingUpdate>>(
      `${this.BASE_URL}/pending-updates/${id}`
    );
    return response.data.data;
  }
}

export default new StoreService();
