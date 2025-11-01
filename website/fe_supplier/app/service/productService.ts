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
  primary?: boolean;
  displayOrder?: number;
  productId?: string;
  variantId?: string;
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
  manufacturingDate?: string; 
  expiryDate: string; 
  images?: ProductImageRequest[]; 
}

export interface StoreStockInfo {
  storeId: string;
  storeName: string;
  stockQuantity: number;
  priceOverride?: number;
}

export interface ProductVariantResponse {
  variantId: string;
  name: string;
  sku: string;
  originalPrice: number;
  discountPrice?: number;
  manufacturingDate?: string;
  expiryDate: string;
  // Stock info
  totalStock?: number;        // Tổng tồn kho tất cả cửa hàng
  isOutOfStock?: boolean;     // Hết hàng
  isExpired?: boolean;        // Hết hạn
  isAvailable?: boolean;      // Có sẵn (còn hàng + chưa hết hạn)
  // Legacy fields
  stockQuantity?: number;
  reservedQuantity?: number;
  attributes?: ProductAttributeResponse[];
  variantImages?: ProductImageResponse[];
  storeStocks?: StoreStockInfo[]; // Chi tiết tồn kho theo cửa hàng
}

export interface StoreInventoryRequest {
  storeId: string;
  variantSku?: string;      // For updates: use existing variant SKU
  variantIndex?: number;    // For creation: use variant index (position in variants array)
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
  // Stock overview
  totalInventory?: number;        // Tổng tồn kho tất cả variants + stores
  availableVariantCount?: number; // Số variants còn hàng và chưa hết hạn
  totalVariantCount?: number;     // Tổng số variants
  createdAt?: string;
  updatedAt?: string;
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
    const payload: any = response.data.data;
    if (!payload) {
      return { content: [], page: { size: 0, number: 0, totalElements: 0, totalPages: 0 } };
    }

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

  // Update stock quantity for a variant at a store
  async updateVariantStock(
    productId: string,
    variantId: string,
    storeId: string,
    stockQuantity: number,
    note?: string
  ): Promise<ProductResponse> {
    const response = await apiClient.patch<ApiResponse<ProductResponse>>(
      `${this.BASE_URL}/${productId}/variants/${variantId}/stores/${storeId}/stock`,
      { stockQuantity, note }
    );
    return response.data.data;
  }
}

export default new ProductService();
