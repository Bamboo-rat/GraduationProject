import apiClient from '~/config/axios';
import type { ApiResponse, PaginatedResponse } from './types';

export interface CategorySuggestion {
  id: number;
  categoryName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  supplierId: string;
  supplierBusinessName?: string;
  processorId?: string;
  processorName?: string;
  adminNotes?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategorySuggestionRequest {
  categoryName: string;
  reason: string;
}

export interface CategorySuggestionListParams {
  page?: number;
  size?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

class CategorySuggestionService {
  private readonly BASE_URL = '/category-suggestions';

  // Get all my category suggestions
  async getMySuggestions(params?: CategorySuggestionListParams): Promise<PaginatedResponse<CategorySuggestion>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<CategorySuggestion>>>(
      `${this.BASE_URL}/my-suggestions`,
      { params }
    );
    return response.data.data;
  }

  // Get suggestion by ID
  async getSuggestionById(id: number): Promise<CategorySuggestion> {
    const response = await apiClient.get<ApiResponse<CategorySuggestion>>(`${this.BASE_URL}/${id}`);
    return response.data.data;
  }

  // Create new category suggestion
  async createSuggestion(data: CreateCategorySuggestionRequest): Promise<CategorySuggestion> {
    const response = await apiClient.post<ApiResponse<CategorySuggestion>>(this.BASE_URL, data);
    return response.data.data;
  }
}

export default new CategorySuggestionService();
