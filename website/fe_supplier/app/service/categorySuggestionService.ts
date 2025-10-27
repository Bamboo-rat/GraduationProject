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
    // Normalize backend Page<> JSON to our PaginatedResponse<T> shape.
    const payload: any = response.data.data;
    if (!payload) {
      return { content: [], page: { size: 0, number: 0, totalElements: 0, totalPages: 0 } };
    }

    if (payload.page) {
      return payload as PaginatedResponse<CategorySuggestion>;
    }

    return {
      content: payload.content || [],
      page: {
        size: typeof payload.size === 'number' ? payload.size : payload.page?.size ?? 10,
        number: typeof payload.number === 'number' ? payload.number : payload.page?.number ?? 0,
        totalElements: typeof payload.totalElements === 'number' ? payload.totalElements : 0,
        totalPages: typeof payload.totalPages === 'number' ? payload.totalPages : 0,
      },
    } as PaginatedResponse<CategorySuggestion>;
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
