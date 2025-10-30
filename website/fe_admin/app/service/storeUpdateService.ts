import apiClient from '~/config/axios';
import type { ApiResponse, PaginatedResponse } from './types';

export interface StorePendingUpdate {
  updateId: string;
  storeId: string;
  currentStoreName: string;
  storeName?: string;
  address?: string;
  phoneNumber?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
  imageUrl?: string;
  status?: string;
  updateStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
  processorId?: string;
  processorName?: string;
}

export interface StorePendingUpdateParams {
  page?: number;
  size?: number;
  status?: string;
  sort?: string;
}

class StoreUpdateService {
  private readonly BASE_URL = '/stores';

  async getAllPendingUpdates(params: StorePendingUpdateParams = {}): Promise<ApiResponse<PaginatedResponse<StorePendingUpdate>>> {
    const response = await apiClient.get(`${this.BASE_URL}/pending-updates`, { params });
    return response.data;
  }

  async getPendingUpdateById(id: string): Promise<ApiResponse<StorePendingUpdate>> {
    const response = await apiClient.get(`${this.BASE_URL}/pending-updates/${id}`);
    return response.data;
  }

  async getPendingUpdatesByStore(storeId: string, params: StorePendingUpdateParams = {}): Promise<ApiResponse<PaginatedResponse<StorePendingUpdate>>> {
    const response = await apiClient.get(`${this.BASE_URL}/${storeId}/pending-updates`, { params });
    return response.data;
  }

  async approveUpdate(id: string, adminNotes?: string): Promise<ApiResponse<StorePendingUpdate>> {
    const response = await apiClient.patch(`${this.BASE_URL}/pending-updates/${id}/approve`, null, {
      params: { adminNotes }
    });
    return response.data;
  }

  async rejectUpdate(id: string, adminNotes: string): Promise<ApiResponse<StorePendingUpdate>> {
    const response = await apiClient.patch(`${this.BASE_URL}/pending-updates/${id}/reject`, null, {
      params: { adminNotes }
    });
    return response.data;
  }
}

export const storeUpdateService = new StoreUpdateService();
