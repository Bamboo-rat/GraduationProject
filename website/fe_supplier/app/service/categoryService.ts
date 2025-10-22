import apiClient from '~/config/axios';
import type { ApiResponse } from './types';

export interface Category {
  id: number;
  categoryName: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

class CategoryService {
  private readonly BASE_URL = '/categories';

  // Get all categories
  async getAllCategories(): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<Category[]>>(this.BASE_URL);
    return response.data.data;
  }

  // Get category by ID
  async getCategoryById(id: number): Promise<Category> {
    const response = await apiClient.get<ApiResponse<Category>>(`${this.BASE_URL}/${id}`);
    return response.data.data;
  }
}

export default new CategoryService();
