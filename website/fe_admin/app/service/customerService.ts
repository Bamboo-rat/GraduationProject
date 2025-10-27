import axiosInstance from '../config/axios';
import type { ApiResponse, PageResponse } from './types';

export interface CustomerResponse {
  userId: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  points: number;
  status: string; // ACTIVE, PENDING_VERIFICATION, SUSPENDED, etc.
  tier: string; // BRONZE, SILVER, GOLD, PLATINUM
  tierUpdatedAt?: string;
  lifetimePoints: number;
  pointsThisYear: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer Service for Admin Portal
 * Handles admin operations for viewing and managing customers
 */
class CustomerService {
  /**
   * Get customer by ID (admin only)
   */
  async getCustomerById(userId: string): Promise<CustomerResponse> {
    const response = await axiosInstance.get<ApiResponse<CustomerResponse>>(`/customers/${userId}`);
    return response.data.data;
  }

  /**
   * Get all customers with pagination and filters (admin only)
   */
  async getAllCustomers(params: {
    page?: number;
    size?: number;
    status?: string;
    tier?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
  }): Promise<PageResponse<CustomerResponse>> {
    const response = await axiosInstance.get<ApiResponse<PageResponse<CustomerResponse>>>('/customers', {
      params: {
        page: params.page || 0,
        size: params.size || 20,
        status: params.status,
        tier: params.tier,
        search: params.search,
        sortBy: params.sortBy || 'createdAt',
        sortDirection: params.sortDirection || 'DESC',
      },
    });
    return response.data.data;
  }

  /**
   * Set customer active/inactive status (admin only)
   */
  async setActiveStatus(userId: string, active: boolean): Promise<CustomerResponse> {
    const response = await axiosInstance.patch<ApiResponse<CustomerResponse>>(
      `/customers/${userId}/active`,
      null,
      { params: { active } }
    );
    return response.data.data;
  }

  /**
   * Get customer statistics (admin dashboard)
   */
  async getCustomerStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byTier: { tier: string; count: number }[];
  }> {
    const response = await axiosInstance.get<ApiResponse<any>>('/customers/stats');
    return response.data.data;
  }
}

export default new CustomerService();
