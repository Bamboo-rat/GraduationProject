import axiosInstance from '../config/axios';

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ============= SUPPLIER REGISTRATION TYPES (4-STEP FLOW) =============

// Step 1: Basic account registration
export interface SupplierRegisterStep1Request {
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  password: string;
}

// Step 1 Response
export interface RegisterResponse {
  userId: string;          // Supplier ID - needed for all subsequent steps
  keycloakId: string;
  username: string;
  email: string;
  phoneNumber: string;
  message: string;
  status: string;          // "PENDING_VERIFICATION", "PENDING_APPROVAL", "ACTIVE"
}

// Step 2: Email OTP verification
export interface SupplierRegisterStep2Request {
  supplierId: string;
  email: string;
  otp: string;
}

// Step 3: Document upload
export interface SupplierRegisterStep3Request {
  supplierId: string;
  email: string;
  businessLicense: string; // License number
  businessLicenseUrl: string; // Uploaded file URL
  foodSafetyCertificate: string; // Certificate number
  foodSafetyCertificateUrl: string; // Uploaded file URL
  avatarUrl?: string; // Optional supplier logo
}

// Step 4: Business and store information
export interface SupplierRegisterStep4Request {
  supplierId: string;
  email: string;
  businessName: string;
  businessAddress: string;
  taxCode: string;
  businessType: BusinessType;

  // First store information
  storeName: string;
  storeAddress: string;
  storePhoneNumber: string;
  latitude: string;
  longitude: string;
  storeDescription?: string;
}

export type BusinessType =
  | 'SUPERMARKET'
  | 'CONVENIENCE_STORE'
  | 'GROCERY_STORE'
  | 'DISTRIBUTOR'
  | 'RESTAURANT'
  | 'BAKERY'
  | 'COFFEE_SHOP'
  | 'OTHER';

// ============= LOGIN TYPES =============

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  // support both backend camelCase and older snake_case shapes
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
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

// ============= AUTH SERVICE =============

class AuthService {
  // ===== SUPPLIER REGISTRATION (4 STEPS) =====

  /**
   * Step 1: Register supplier account with basic info
   * Status after: PENDING_VERIFICATION (awaiting email OTP)
   */
  async registerSupplierStep1(request: SupplierRegisterStep1Request): Promise<RegisterResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<RegisterResponse>>(
        '/auth/register/supplier/step1',
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Step 2: Verify email with OTP
   * Status after: PENDING_DOCUMENTS (awaiting document upload)
   */
  async registerSupplierStep2(request: SupplierRegisterStep2Request): Promise<string> {
    try {
      const response = await axiosInstance.post<ApiResponse<string>>(
        '/auth/register/supplier/step2',
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend OTP to supplier email
   */
  async resendSupplierOtp(supplierId: string): Promise<string> {
    try {
      const response = await axiosInstance.post<ApiResponse<string>>(
        `/auth/register/supplier/resend-otp?supplierId=${supplierId}`
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Step 3: Upload business documents
   * Status after: PENDING_STORE_INFO (awaiting store information)
   * NOTE: Upload files to /storage/upload first, then include URLs here
   */
  async registerSupplierStep3(request: SupplierRegisterStep3Request): Promise<string> {
    try {
      const response = await axiosInstance.post<ApiResponse<string>>(
        '/auth/register/supplier/step3',
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Step 4: Submit business and store information
   * Status after: PENDING_APPROVAL (awaiting admin approval)
   */
  async registerSupplierStep4(request: SupplierRegisterStep4Request): Promise<string> {
    try {
      const response = await axiosInstance.post<ApiResponse<string>>(
        '/auth/register/supplier/step4',
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ===== AUTHENTICATION =====

  /**
   * Login user (all types: supplier, admin, customer)
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
        '/auth/login',
        credentials
      );

      const loginData = response.data.data;

      // Save tokens and user info to localStorage
      // Backend returns camelCase (accessToken/refreshToken). Older clients used snake_case.
      const access = (loginData as any).accessToken ?? (loginData as any).access_token;
      const refresh = (loginData as any).refreshToken ?? (loginData as any).refresh_token;

      if (access && refresh) {
        this.setTokens(access, refresh);
      } else {
        // Defensive: clear any partial auth
        this.clearAuth();
        throw new Error('Login response did not include tokens');
      }

      // Store user info
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
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await axiosInstance.post('/auth/logout', null, {
          params: { refreshToken }
        });
      }
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

      const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
        '/auth/refresh',
        null,
        {
          params: { refreshToken }
        }
      );

      const loginData = response.data.data;
      // Update both tokens - support both shapes
      const access = (loginData as any).accessToken ?? (loginData as any).access_token;
      const refresh = (loginData as any).refreshToken ?? (loginData as any).refresh_token;

      if (access && refresh) {
        this.setTokens(access, refresh);
        return access;
      }

      this.clearAuth();
      throw new Error('Refresh response did not include tokens');
    } catch (error: any) {
      this.clearAuth();
      throw this.handleError(error);
    }
  }

  // ===== LOCAL STORAGE HELPERS =====

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getUserInfo(): UserInfo | null {
    const userInfoStr = localStorage.getItem('user_info');
    if (!userInfoStr) return null;

    try {
      return JSON.parse(userInfoStr);
    } catch {
      return null;
    }
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private setUserInfo(userInfo: UserInfo): void {
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  }

  clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  }

  // ===== ERROR HANDLING =====

  private handleError(error: any): Error {
    // Ưu tiên vietnameseMessage từ backend, sau đó mới đến message
    const errorMessage = error.response?.data?.vietnameseMessage || 
                        error.response?.data?.message || 
                        error.message || 
                        'Đã xảy ra lỗi không mong muốn';
    return new Error(errorMessage);
  }
}

// Export singleton instance
export default new AuthService();
