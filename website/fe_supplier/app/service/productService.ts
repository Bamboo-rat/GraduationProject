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
}

class ProductService {
  private readonly BASE_URL = '/products';

  // Get all my products (supplier's own products)
  async getMyProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(
      `${this.BASE_URL}/supplier/my-products`,
      { params }
    );
    return response.data.data;
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

  // Update product status (AVAILABLE/SOLD_OUT)
  async updateProductStatus(id: number, status: 'AVAILABLE' | 'SOLD_OUT'): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(
      `${this.BASE_URL}/${id}/status`,
      null,
      { params: { status } }
    );
    return response.data.data;
  }

  // Soft delete product
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new ProductService();
