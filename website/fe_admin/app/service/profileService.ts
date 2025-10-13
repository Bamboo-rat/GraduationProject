import axiosInstance from '../config/axios';
import type { ApiResponse } from './authService';

// Types
export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface ProfileResponse {
  userId: string;
  keycloakId: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  fullName: string | null;
  active: boolean;
  roles: string[];
  status: string;
  userType: string;
  createdAt: string;
  updatedAt: string;
}

// Profile Service
class ProfileService {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<ProfileResponse>>('/auth/me');
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    try {
      const response = await axiosInstance.put<ApiResponse<ProfileResponse>>(
        '/auth/profile',
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await axiosInstance.post<ApiResponse<void>>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post<ApiResponse<{ url: string }>>(
        '/auth/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.data.url;
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
export default new ProfileService();
