import axiosInstance from '../config/axios';

// Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
  userInfo: UserInfo;
}

export interface UserInfo {
  userId: string;
  keycloakId?: string;
  username: string;
  email: string;
  phoneNumber?: string;
  fullName?: string;
  avatarUrl?: string;
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

      console.log('🔐 Login response:', loginData);

      // Backend returns camelCase (accessToken/refreshToken). Support both formats for compatibility.
      const access = (loginData as any).accessToken ?? (loginData as any).access_token;
      const refresh = (loginData as any).refreshToken ?? (loginData as any).refresh_token;

      console.log('🔑 Access token:', access ? 'EXISTS' : 'MISSING');
      console.log('🔑 Refresh token:', refresh ? 'EXISTS' : 'MISSING');

      if (access && refresh) {
        // Save tokens and user info to localStorage
        this.setTokens(access, refresh);
        this.setUserInfo(loginData.userInfo);

        console.log('💾 Token saved to localStorage:', localStorage.getItem('access_token') ? 'YES' : 'NO');

        return loginData;
      } else {
        // Defensive: clear any partial auth
        console.error('❌ Login response missing tokens!');
        this.clearAuth();
        throw new Error('Login response did not include tokens');
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();

      // Call logout endpoint to revoke refresh token in Keycloak
      if (refreshToken) {
        await axiosInstance.post('/auth/logout', null, {
          params: {
            refreshToken: refreshToken
          }
        });
      }

      // Clear all stored data
      this.clearAuth();
    } catch (error: any) {
      // Clear auth data even if API call fails
      this.clearAuth();
      console.error('Logout error:', error);
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

      const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
        '/auth/refresh',
        null,
        {
          params: {
            refreshToken: refreshToken
          }
        }
      );

      const loginData = response.data.data;

      // Support both camelCase and snake_case token formats
      const access = (loginData as any).accessToken ?? (loginData as any).access_token;
      const refresh = (loginData as any).refreshToken ?? (loginData as any).refresh_token;

      if (access && refresh) {
        this.setTokens(access, refresh);
        return access;
      }

      // If tokens are missing, clear auth and throw error
      this.clearAuth();
      throw new Error('Refresh response did not include tokens');
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
    // Prefer vietnameseMessage from backend when available, then message, then fallback
    const vietnamese = error.response?.data?.vietnameseMessage || error.response?.data?.vietnamese_message;
    const msg = error.response?.data?.message || error.response?.data?.error || error.message;
    if (vietnamese) return new Error(vietnamese);
    if (msg) return new Error(msg);
    return new Error('An unexpected error occurred');
  }
}

// Export singleton instance
export default new AuthService();