import axiosInstance from '../config/axios';
import type { ApiResponse, PageResponse } from './types';

export interface BannerResponse {
  bannerId: string;
  imageUrl: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface BannerRequest {
  imageUrl: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * Banner Service for Admin Portal
 * Handles admin operations for managing banners
 */
class BannerService {
  /**
   * Get all banners with pagination and filters (admin view)
   */
  async getAllBanners(params: {
    page?: number;
    size?: number;
    status?: 'ACTIVE' | 'INACTIVE';
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
  }): Promise<PageResponse<BannerResponse>> {
    const response = await axiosInstance.get<ApiResponse<PageResponse<BannerResponse>>>('/banners', {
      params: {
        page: params.page || 0,
        size: params.size || 20,
        status: params.status,
        sortBy: params.sortBy || 'createdAt',
        sortDirection: params.sortDirection || 'DESC',
      },
    });
    return response.data.data;
  }

  /**
   * Get active banners (public - for customers)
   */
  async getActiveBanners(): Promise<BannerResponse[]> {
    const response = await axiosInstance.get<ApiResponse<BannerResponse[]>>('/banners/active');
    return response.data.data;
  }

  /**
   * Get banner by ID
   */
  async getBannerById(bannerId: string): Promise<BannerResponse> {
    const response = await axiosInstance.get<ApiResponse<BannerResponse>>(`/banners/${bannerId}`);
    return response.data.data;
  }

  /**
   * Create new banner (Admin only)
   */
  async createBanner(request: BannerRequest): Promise<BannerResponse> {
    const response = await axiosInstance.post<ApiResponse<BannerResponse>>('/banners', request);
    return response.data.data;
  }

  /**
   * Update banner (Admin only)
   */
  async updateBanner(bannerId: string, request: BannerRequest): Promise<BannerResponse> {
    const response = await axiosInstance.put<ApiResponse<BannerResponse>>(`/banners/${bannerId}`, request);
    return response.data.data;
  }

  /**
   * Delete banner (Admin only)
   */
  async deleteBanner(bannerId: string): Promise<void> {
    await axiosInstance.delete(`/banners/${bannerId}`);
  }

  /**
   * Activate banner (Admin only)
   */
  async activateBanner(bannerId: string): Promise<BannerResponse> {
    const response = await axiosInstance.patch<ApiResponse<BannerResponse>>(`/banners/${bannerId}/activate`);
    return response.data.data;
  }

  /**
   * Deactivate banner (Admin only)
   */
  async deactivateBanner(bannerId: string): Promise<BannerResponse> {
    const response = await axiosInstance.patch<ApiResponse<BannerResponse>>(`/banners/${bannerId}/deactivate`);
    return response.data.data;
  }

  /**
   * Get status badge color for UI display
   */
  getStatusColorClass(status: 'ACTIVE' | 'INACTIVE'): string {
    return status === 'ACTIVE'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status label in Vietnamese
   */
  getStatusLabel(status: 'ACTIVE' | 'INACTIVE'): string {
    return status === 'ACTIVE' ? 'Đang hiển thị' : 'Đã tắt';
  }
}

export default new BannerService();
