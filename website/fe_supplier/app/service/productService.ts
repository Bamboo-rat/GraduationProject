import apiClient from '~/config/axios';
import type { ApiResponse, PaginatedResponse } from './types';

// Product status enum matching backend
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'SUSPENDED' | 'DELETED';

// Product related interfaces matching backend DTOs
export interface ProductImageRequest {
  imageUrl: string;
  isPrimary: boolean;
}

export interface ProductImageResponse {
  imageId: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductAttributeRequest {
  attributeName: string;
  attributeValue: string;
}

export interface ProductAttributeResponse {
  attributeId: string;
  attributeName: string;
  attributeValue: string;
}

export interface ProductVariantRequest {
  name: string;
  originalPrice: number;
  discountPrice?: number;
  manufacturingDate?: string; // ISO date string
  expiryDate: string; // ISO date string (required)
}

export interface ProductVariantResponse {
  variantId: string;
  name: string;
  sku: string;
  originalPrice: number;
  discountPrice?: number;
  manufacturingDate?: string;
  expiryDate: string;
  stockQuantity: number;
  reservedQuantity: number;
  attributes: ProductAttributeResponse[];
}

export interface StoreInventoryRequest {
  storeId: string;
  variantSku: string; // SKU is auto-generated, will be filled after variants are created
  stockQuantity: number;
  priceOverride?: number;
}

export interface ProductInfoRequest {
  name: string;
  description?: string;
  categoryId: string;
}

export interface CreateProductRequest {
  product: ProductInfoRequest;
  attributes: ProductAttributeRequest[];
  variants: ProductVariantRequest[];
  images: ProductImageRequest[];
  storeInventory: StoreInventoryRequest[];
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  categoryId: string;
}

export interface ProductResponse {
  productId: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  status: ProductStatus;
  suspensionReason?: string;
  images: ProductImageResponse[];
  variants: ProductVariantResponse[];
  attributes: ProductAttributeResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  page?: number;
  size?: number;
  status?: ProductStatus;
  search?: string;
}

class ProductService {
  private readonly BASE_URL = '/products';

  // Get all my products (supplier's own products)
  async getMyProducts(params?: ProductListParams): Promise<PaginatedResponse<ProductResponse>> {
    const response = await apiClient.get<ApiResponse<any>>(
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
      return payload as PaginatedResponse<ProductResponse>;
    }

    return {
      content: payload.content || [],
      page: {
        size: typeof payload.size === 'number' ? payload.size : payload.page?.size ?? 10,
        number: typeof payload.number === 'number' ? payload.number : payload.page?.number ?? 0,
        totalElements: typeof payload.totalElements === 'number' ? payload.totalElements : 0,
        totalPages: typeof payload.totalPages === 'number' ? payload.totalPages : 0,
      },
    } as PaginatedResponse<ProductResponse>;
  }

  // Get product by ID
  async getProductById(id: string): Promise<ProductResponse> {
    const response = await apiClient.get<ApiResponse<ProductResponse>>(`${this.BASE_URL}/${id}`);
    return response.data.data;
  }

  // Create new product
  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    const response = await apiClient.post<ApiResponse<ProductResponse>>(this.BASE_URL, data);
    return response.data.data;
  }

  // Update product (basic info only: name, description, category)
  async updateProduct(id: string, data: UpdateProductRequest): Promise<ProductResponse> {
    const response = await apiClient.put<ApiResponse<ProductResponse>>(`${this.BASE_URL}/${id}`, data);
    return response.data.data;
  }

  // Toggle product visibility (ACTIVE/INACTIVE)
  async toggleProductVisibility(id: string, makeActive: boolean): Promise<ProductResponse> {
    const response = await apiClient.patch<ApiResponse<ProductResponse>>(
      `${this.BASE_URL}/${id}/visibility`,
      null,
      { params: { makeActive } }
    );
    return response.data.data;
  }

  // Soft delete product
  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new ProductService();
