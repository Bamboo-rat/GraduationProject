import axiosInstance from '../config/axios';
import type { ApiResponse } from './authService';

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
  /**
   * Register new admin/staff (SUPER_ADMIN only)
   */
  async registerAdmin(request: AdminRegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<RegisterResponse>>(
        '/admins/register',
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current admin profile
   */
  async getCurrentAdmin(): Promise<AdminResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<AdminResponse>>('/admins/me');
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get admin by ID (super admin only)
   */
  async getAdminById(userId: string): Promise<AdminResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<AdminResponse>>(`/admins/${userId}`);
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update current admin profile
   */
  async updateProfile(request: AdminUpdateRequest): Promise<AdminResponse> {
    try {
      const response = await axiosInstance.put<ApiResponse<AdminResponse>>(
        '/admins/me',
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all admins with pagination (super admin only)
   * TODO: Implement when backend is ready
   */
  async getAllAdmins(page: number = 0, size: number = 20, role?: string, status?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', size.toString());
      if (role) params.append('role', role);
      if (status) params.append('status', status);

      const response = await axiosInstance.get<ApiResponse<any>>(
        `/admins?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Approve admin (set to ACTIVE status)
   */
  async approveAdmin(userId: string): Promise<AdminResponse> {
    try {
      const response = await axiosInstance.patch<ApiResponse<AdminResponse>>(
        `/admins/${userId}/approve`
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Suspend admin account
   */
  async suspendAdmin(userId: string, reason?: string): Promise<AdminResponse> {
    try {
      const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      const response = await axiosInstance.patch<ApiResponse<AdminResponse>>(
        `/admins/${userId}/suspend${params}`
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Activate admin account
   */
  async activateAdmin(userId: string): Promise<AdminResponse> {
    try {
      const response = await axiosInstance.patch<ApiResponse<AdminResponse>>(
        `/admins/${userId}/activate`
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return new Error(error.message || 'An unexpected error occurred');
  }
}

// Export singleton instance
export default new AdminService();
