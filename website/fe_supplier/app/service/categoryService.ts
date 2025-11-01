import apiClient from '~/config/axios';
import type { ApiResponse, Page } from './types';

export interface Category {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GetCategoriesParams {
  page?: number;
  size?: number;
  active?: boolean;
  search?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

class CategoryService {
  private readonly BASE_URL = '/categories';

  // Get all categories (paginated)
  async getAllCategories(params?: GetCategoriesParams): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<Page<Category>>>(this.BASE_URL, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 100, // Get all categories by default
        active: params?.active ?? true, // Only active categories by default
        search: params?.search,
        sortBy: params?.sortBy ?? 'name',
        sortDirection: params?.sortDirection ?? 'ASC',
      },
    });
    // Extract content array from paginated response
    return response.data.data.content;
  }

  // Get paginated categories (when you need pagination info)
  async getCategoriesPaginated(params?: GetCategoriesParams): Promise<Page<Category>> {
    const response = await apiClient.get<ApiResponse<Page<Category>>>(this.BASE_URL, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        active: params?.active,
        search: params?.search,
        sortBy: params?.sortBy ?? 'name',
        sortDirection: params?.sortDirection ?? 'ASC',
      },
    });
    return response.data.data;
  }

  // Get category by ID
  async getCategoryById(id: string): Promise<Category> {
    const response = await apiClient.get<ApiResponse<Category>>(`${this.BASE_URL}/${id}`);
    return response.data.data;
  }
}

export default new CategoryService();
