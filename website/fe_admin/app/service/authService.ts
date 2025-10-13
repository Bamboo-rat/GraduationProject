import axiosInstance from '../config/axios';

// Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  userInfo: UserInfo;
}

export interface UserInfo {
  userId: string;
  keycloakId?: string;
  username: string;
  email: string;
  phoneNumber?: string;
  fullName?: string;
  roles: string[];
  status: string;
  userType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Auth Service
class AuthService {
  /**
   * Login admin user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
        '/auth/login',
        credentials
      );
      
      const loginData = response.data.data;
      
      // Save tokens and user info to localStorage
      this.setTokens(loginData.access_token, loginData.refresh_token);
      this.setUserInfo(loginData.userInfo);
      
      return loginData;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Optional: Call logout endpoint if exists
      // await axiosInstance.post('/auth/logout');
      
      // Clear all stored data
      this.clearAuth();
    } catch (error: any) {
      // Clear auth data even if API call fails
      this.clearAuth();
      throw this.handleError(error);
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserInfo> {
    try {
      const response = await axiosInstance.get<ApiResponse<UserInfo>>('/auth/me');
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axiosInstance.post<ApiResponse<{ access_token: string }>>(
        '/auth/refresh',
        { refresh_token: refreshToken }
      );

      const newAccessToken = response.data.data.access_token;
      localStorage.setItem('access_token', newAccessToken);
      
      return newAccessToken;
    } catch (error: any) {
      this.clearAuth();
      throw this.handleError(error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Get user info from localStorage
   */
  getUserInfo(): UserInfo | null {
    const userInfoStr = localStorage.getItem('user_info');
    if (!userInfoStr) return null;
    
    try {
      return JSON.parse(userInfoStr);
    } catch {
      return null;
    }
  }

  /**
   * Set tokens to localStorage
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Set user info to localStorage
   */
  private setUserInfo(userInfo: UserInfo): void {
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
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
export default new AuthService();