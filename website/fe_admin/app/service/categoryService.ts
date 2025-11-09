import axiosInstance from '../config/axios';

// ============= TYPES =============

export interface Category {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
}

export interface CategoryPageResponse {
  content: Category[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  timestamp: string;
}

// ============= SERVICE CLASS =============

class CategoryService {
  private baseUrl = '/categories';

  /**
   * Get all categories with pagination and filters
   */
  async getAllCategories(
    page: number = 0,
    size: number = 20,
    active?: boolean,
    search?: string,
    sortBy: string = 'name',
    sortDirection: 'ASC' | 'DESC' = 'ASC'
  ): Promise<CategoryPageResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection,
      });

      if (active !== undefined) {
        params.append('active', active.toString());
      }
      if (search) {
        params.append('search', search);
      }

      const response = await axiosInstance.get<ApiResponse<CategoryPageResponse>>(
        `${this.baseUrl}?${params.toString()}`
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách danh mục');
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<Category> {
    try {
      const response = await axiosInstance.get<ApiResponse<Category>>(
        `${this.baseUrl}/${categoryId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching category:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin danh mục');
    }
  }

  /**
   * Create new category
   */
  async createCategory(request: CategoryRequest): Promise<Category> {
    try {
      const response = await axiosInstance.post<ApiResponse<Category>>(
        this.baseUrl,
        request
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo danh mục');
    }
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: string, request: CategoryRequest): Promise<Category> {
    try {
      const response = await axiosInstance.put<ApiResponse<Category>>(
        `${this.baseUrl}/${categoryId}`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating category:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật danh mục');
    }
  }

  /**
   * Toggle category active status
   */
  async toggleActive(categoryId: string, active: boolean): Promise<Category> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Category>>(
        `${this.baseUrl}/${categoryId}/toggle-active?active=${active}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error toggling category status:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái danh mục');
    }
  }

  /**
   * Get active categories only (for dropdowns)
   */
  async getActiveCategories(): Promise<Category[]> {
    try {
      const response = await this.getAllCategories(0, 1000, true);
      return response.content;
    } catch (error: any) {
      console.error('Error fetching active categories:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách danh mục');
    }
  }
}

export default new CategoryService();
