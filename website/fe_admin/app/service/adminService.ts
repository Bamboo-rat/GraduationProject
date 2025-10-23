import axiosInstance from '../config/axios';
import type { ApiResponse, PageResponse } from './types';

// Types
export interface AdminRegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: 'ROLE_SUPER_ADMIN' | 'ROLE_MODERATOR' | 'ROLE_STAFF';
  avatarUrl?: string;
}

export interface AdminUpdateRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface AdminResponse {
  // User fields
  userId: string;
  keycloakId: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  avatarUrl: string;
  active: boolean;

  // Admin-specific fields
  role: string;
  status: string; // PENDING_APPROVAL, ACTIVE, INACTIVE
  lastLoginIp: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface RegisterResponse {
  userId: string;
  username: string;
  email: string;
  message: string;
}

// Admin Service
class AdminService {
  private handleError(error: any): Error {
    return new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }

  /**
   * Register new admin/staff (SUPER_ADMIN only)
   */
  async registerAdmin(request: AdminRegisterRequest): Promise<RegisterResponse> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<RegisterResponse>>('/admins/register', request);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current admin profile
   */
  async getCurrentAdmin(): Promise<AdminResponse> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<AdminResponse>>('/admins/me');
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get admin by ID (super admin only)
   */
  async getAdminById(userId: string): Promise<AdminResponse> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<AdminResponse>>(`/admins/${userId}`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update current admin profile
   */
  async updateProfile(request: AdminUpdateRequest): Promise<AdminResponse> {
    try {
      const { data } = await axiosInstance.put<ApiResponse<AdminResponse>>('/admins/me', request);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all admins with pagination (super admin only)
   */
  async getAllAdmins(
    page: number = 0,
    size: number = 20,
    role?: string,
    status?: string
  ): Promise<PageResponse<AdminResponse>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });
      
      if (role && role !== 'ALL') params.append('role', role);
      if (status && status !== 'ALL') params.append('status', status);

      const { data } = await axiosInstance.get<ApiResponse<PageResponse<AdminResponse>>>(
        `/admins?${params.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Approve admin (set to ACTIVE status)
   */
  async approveAdmin(userId: string): Promise<AdminResponse> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse<AdminResponse>>(`/admins/${userId}/approve`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Suspend admin account
   */
  async suspendAdmin(userId: string, reason?: string): Promise<AdminResponse> {
    try {
      const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      const { data } = await axiosInstance.patch<ApiResponse<AdminResponse>>(`/admins/${userId}/suspend${params}`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Activate admin account
   */
  async activateAdmin(userId: string): Promise<AdminResponse> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse<AdminResponse>>(`/admins/${userId}/activate`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update admin role (super admin only)
   */
  async updateAdminRole(userId: string, role: string): Promise<AdminResponse> {
    try {
      const { data } = await axiosInstance.patch<ApiResponse<AdminResponse>>(
        `/admins/${userId}/role?role=${role}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update admin status (super admin only)
   */
  async updateAdminStatus(userId: string, status: string): Promise<AdminResponse> {
    try {
      // Use existing endpoints based on status
      if (status === 'ACTIVE') {
        return await this.approveAdmin(userId);
      } else if (status === 'INACTIVE') {
        return await this.suspendAdmin(userId);
      }
      throw new Error('Invalid status');
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Export singleton instance
export default new AdminService();
