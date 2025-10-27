import apiClient from '~/config/axios';
import type { ApiResponse, PaginatedResponse } from './types';

// Product related interfaces
export interface ProductImage {
  id?: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductAttribute {
  id?: number;
  attributeName: string;
  attributeValue: string;
}

export interface ProductVariant {
  id?: number;
  variantName: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  reservedQuantity: number;
  expiryDate?: string;
  attributes: ProductAttribute[];
}

export interface Product {
  id?: number;
  productName: string;
  description: string;
  categoryId: number;
  categoryName?: string;
  supplierId?: string;
  supplierBusinessName?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SOLD_OUT';
  rejectionReason?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListParams {
  page?: number;
  size?: number;
  status?: string;
  categoryId?: number;
  search?: string;
}

export interface CreateProductRequest {
  productName: string;
  description: string;
  categoryId: number;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface UpdateProductRequest {
  productName?: string;
  description?: string;
  categoryId?: number;
  images?: ProductImage[];
  variants?: ProductVariant[];
  status?: string;
}

class ProductService {
  private readonly BASE_URL = '/products';

  // Get all my products (supplier's own products)
  async getMyProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
      `${this.BASE_URL}/my-products`,
      { params }
    );
    // Normalize backend Page<> JSON to our PaginatedResponse<T> shape.
    const payload: any = response.data.data;
    if (!payload) {
      return { content: [], page: { size: 0, number: 0, totalElements: 0, totalPages: 0 } };
    }

    // Spring's Page serialization often exposes totalPages/totalElements at top-level
    // while our frontend expects a nested `page` object. Normalize both shapes here.
    if (payload.page) {
      return payload as PaginatedResponse<Product>;
    }

    return {
      content: payload.content || [],
      page: {
        size: typeof payload.size === 'number' ? payload.size : payload.page?.size ?? 10,
        number: typeof payload.number === 'number' ? payload.number : payload.page?.number ?? 0,
        totalElements: typeof payload.totalElements === 'number' ? payload.totalElements : 0,
        totalPages: typeof payload.totalPages === 'number' ? payload.totalPages : 0,
      },
    } as PaginatedResponse<Product>;
  }

  // Get product by ID
  async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`${this.BASE_URL}/${id}`);
    return response.data.data;
  }

  // Create new product
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>(this.BASE_URL, data);
    return response.data.data;
  }

  // Update product
  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(`${this.BASE_URL}/${id}`, data);
    return response.data.data;
  }

  // Toggle product visibility (ACTIVE/INACTIVE)
  async toggleProductVisibility(id: number, makeActive: boolean): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(
      `${this.BASE_URL}/${id}/visibility`,
      null,
      { params: { makeActive } }
    );
    return response.data.data;
  }

  // Soft delete product
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new ProductService();
