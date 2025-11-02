import axiosInstance from '~/config/axios';

// ============= TYPES =============

export interface Supplier {
  userId: string;
  keycloakId: string;
  username: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  avatarUrl?: string;
  active: boolean;
  businessName: string;
  businessLicense: string;
  businessLicenseUrl: string;
  foodSafetyCertificate: string;
  foodSafetyCertificateUrl: string;
  taxCode: string;
  businessAddress: string;
  businessType: string;
  commissionRate: number;
  status: SupplierStatus;
  stores: StoreBasicInfo[];
  totalProducts: number;
  totalStores: number;
  createdAt: string;
  updatedAt: string;
}

export type SupplierStatus = 
  | 'PENDING_VERIFICATION'   // Chờ xác thực email
  | 'PENDING_DOCUMENTS'      // Chờ tải lên giấy tờ
  | 'PENDING_STORE_INFO'     // Chờ thông tin cửa hàng
  | 'PENDING_APPROVAL'       // Chờ admin duyệt
  | 'ACTIVE'                 // Đã kích hoạt
  | 'PAUSE'                  // Tạm dừng (supplier tự dừng)
  | 'SUSPENDED'              // Bị đình chỉ (admin khóa)
  | 'REJECTED';              // Bị từ chối

export interface StoreBasicInfo {
  storeId: number;
  storeName: string;
  address: string;
  phoneNumber: string;
  status: string;
}

export interface SupplierPageResponse {
  content: Supplier[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApproveRejectRequest {
  note?: string;
  reason?: string;
}

// ============= SERVICE CLASS =============

class SupplierService {
  private baseUrl = '/suppliers';

  /**
   * Get all suppliers with pagination and filters
   */
  async getAllSuppliers(
    page: number = 0,
    size: number = 20,
    status?: SupplierStatus,
    search?: string,
    sortBy: string = 'createdAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<SupplierPageResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection,
      });

      if (status) {
        params.append('status', status);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await axiosInstance.get<ApiResponse<SupplierPageResponse>>(
        `${this.baseUrl}?${params.toString()}`
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách nhà cung cấp');
    }
  }

  /**
   * Get pending suppliers (waiting for approval)
   */
  async getPendingSuppliers(page: number = 0, size: number = 20): Promise<SupplierPageResponse> {
    return this.getAllSuppliers(page, size, 'PENDING_APPROVAL', undefined, 'createdAt', 'ASC');
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(userId: string): Promise<Supplier> {
    try {
      const response = await axiosInstance.get<ApiResponse<Supplier>>(
        `${this.baseUrl}/${userId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching supplier:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin nhà cung cấp');
    }
  }

  /**
   * Approve a supplier
   */
  async approveSupplier(userId: string, note?: string): Promise<Supplier> {
    try {
      const params = note ? `?note=${encodeURIComponent(note)}` : '';
      const response = await axiosInstance.patch<ApiResponse<Supplier>>(
        `${this.baseUrl}/${userId}/approve${params}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error approving supplier:', error);
      throw new Error(error.response?.data?.message || 'Không thể duyệt nhà cung cấp');
    }
  }

  /**
   * Reject a supplier
   */
  async rejectSupplier(userId: string, reason?: string): Promise<Supplier> {
    try {
      const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      const response = await axiosInstance.patch<ApiResponse<Supplier>>(
        `${this.baseUrl}/${userId}/reject${params}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error rejecting supplier:', error);
      throw new Error(error.response?.data?.message || 'Không thể từ chối nhà cung cấp');
    }
  }

  /**
   * Update supplier status
   */
  async updateSupplierStatus(userId: string, status: SupplierStatus): Promise<Supplier> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Supplier>>(
        `${this.baseUrl}/${userId}/status?status=${status}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating supplier status:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  }

  /**
   * Set supplier active/inactive
   */
  async setSupplierActive(userId: string, active: boolean): Promise<Supplier> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Supplier>>(
        `${this.baseUrl}/${userId}/active?active=${active}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error setting supplier active status:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái hoạt động');
    }
  }

  /**
   * Update supplier commission rate
   */
  async updateCommissionRate(userId: string, commissionRate: number): Promise<Supplier> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Supplier>>(
        `${this.baseUrl}/${userId}/commission`,
        { commissionRate }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating commission rate:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật tỷ lệ hoa hồng');
    }
  }

  /**
   * Suspend supplier (Admin only)
   */
  async suspendSupplier(userId: string, reason: string): Promise<Supplier> {
    try {
      const params = `?reason=${encodeURIComponent(reason)}`;
      const response = await axiosInstance.patch<ApiResponse<Supplier>>(
        `${this.baseUrl}/${userId}/suspend${params}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error suspending supplier:', error);
      throw new Error(error.response?.data?.message || 'Không thể đình chỉ nhà cung cấp');
    }
  }

  /**
   * Unsuspend supplier (Admin only)
   */
  async unsuspendSupplier(userId: string): Promise<Supplier> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Supplier>>(
        `${this.baseUrl}/${userId}/unsuspend`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error unsuspending supplier:', error);
      throw new Error(error.response?.data?.message || 'Không thể gỡ bỏ đình chỉ nhà cung cấp');
    }
  }

  /**
   * Get supplier status label in Vietnamese
   */
  getStatusLabel(status: SupplierStatus): string {
    const labels: Record<SupplierStatus, string> = {
      PENDING_VERIFICATION: 'Chờ xác thực email',
      PENDING_DOCUMENTS: 'Chờ tải lên giấy tờ',
      PENDING_STORE_INFO: 'Chờ thông tin cửa hàng',
      PENDING_APPROVAL: 'Chờ duyệt',
      ACTIVE: 'Đang hoạt động',
      PAUSE: 'Tạm dừng',
      SUSPENDED: 'Bị đình chỉ',
      REJECTED: 'Bị từ chối',
    };
    return labels[status] || status;
  }

  /**
   * Get supplier status color class for badges
   */
  getStatusColorClass(status: SupplierStatus): string {
    const colors: Record<SupplierStatus, string> = {
      PENDING_VERIFICATION: 'bg-blue-100 text-blue-800',
      PENDING_DOCUMENTS: 'bg-yellow-100 text-yellow-800',
      PENDING_STORE_INFO: 'bg-yellow-100 text-yellow-800',
      PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSE: 'bg-yellow-100 text-yellow-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
}

export default new SupplierService();
