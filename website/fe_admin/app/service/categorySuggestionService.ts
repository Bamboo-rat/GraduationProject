import apiClient from '~/config/axios';
import type { ApiResponse, PageResponse } from './types';

export interface CategorySuggestion {
  suggestionId: string;
  name: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
  supplierId: string;
  supplierName: string;
  supplierBusinessName: string;
  adminId?: string;
  adminName?: string;
}

export interface CategorySuggestionParams {
  page?: number;
  size?: number;
  status?: string;
  sort?: string;
}

class CategorySuggestionService {
  private readonly BASE_URL = '/category-suggestions';

  async getAllSuggestions(params: CategorySuggestionParams = {}): Promise<PageResponse<CategorySuggestion>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CategorySuggestion>>>(this.BASE_URL, { params });
    return response.data.data;
  }

  async getSuggestionById(id: string): Promise<ApiResponse<CategorySuggestion>> {
    const response = await apiClient.get(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async approveSuggestion(id: string, adminNotes?: string): Promise<ApiResponse<CategorySuggestion>> {
    const response = await apiClient.patch(`${this.BASE_URL}/${id}/approve`, null, {
      params: { adminNotes }
    });
    return response.data;
  }

  async rejectSuggestion(id: string, adminNotes: string): Promise<ApiResponse<CategorySuggestion>> {
    const response = await apiClient.patch(`${this.BASE_URL}/${id}/reject`, null, {
      params: { adminNotes }
    });
    return response.data;
  }
}

export const categorySuggestionService = new CategorySuggestionService();
