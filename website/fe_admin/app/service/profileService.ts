import axiosInstance from '../config/axios';
import type { ApiResponse } from './authService';

// Types
export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  avatarUrl?: string;
}

export interface ProfileResponse {
  userId: string;
  keycloakId: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  fullName: string | null;
  avatarUrl?: string | null;
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
   * For admins, use /admins/me endpoint
   */
  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<ProfileResponse>>('/admins/me');
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update current user profile
   * For admins, use /admins/me endpoint
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    try {
      const response = await axiosInstance.put<ApiResponse<ProfileResponse>>(
        '/admins/me',
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
   * Use file storage endpoint with avatar-admin bucket
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post<ApiResponse<{ url: string; fileName: string; fileSize: string }>>(
        '/files/upload/avatar/admin',
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
