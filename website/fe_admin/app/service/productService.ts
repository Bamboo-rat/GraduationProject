import apiClient from '~/config/axios';
import type { ApiResponse, PaginatedResponse } from './types';

export interface Product {
  productId: string;
  name: string;
  description: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SOLD_OUT';
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
}

export interface ProductImage {
  imageId: string;
  imageUrl: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  variantId: string;
  name: string;
  sku: string;
  originalPrice: number;
  discountPrice?: number;
  manufacturingDate?: string;
  expiryDate?: string;
}

export interface ProductAttribute {
  attributeId: string;
  attributeName: string;
  attributeValue: string;
}

export interface ProductListParams {
  page?: number;
  size?: number;
  status?: string;
  categoryId?: string;
  supplierId?: string;
  search?: string;
  sort?: string;
}

class ProductService {
  private readonly BASE_URL = '/api/products';

  async getAllProducts(params: ProductListParams = {}): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const response = await apiClient.get(this.BASE_URL, { params });
    return response.data;
  }

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async approveProduct(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.patch(`${this.BASE_URL}/${id}/approve`);
    return response.data;
  }

  async rejectProduct(id: string, reason: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.patch(`${this.BASE_URL}/${id}/reject`, null, {
      params: { reason }
    });
    return response.data;
  }
}

export const productService = new ProductService();
