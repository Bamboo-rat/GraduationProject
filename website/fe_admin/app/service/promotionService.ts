import axiosInstance from '../config/axios';

// ============= TYPES =============

export type PromotionStatus = 'ACTIVE' | 'INACTIVE';
export type PromotionTier =
  | 'GENERAL'
  | 'BRONZE_PLUS'
  | 'SILVER_PLUS'
  | 'GOLD_PLUS'
  | 'PLATINUM_PLUS'
  | 'DIAMOND_ONLY'
  | 'BIRTHDAY'
  | 'FIRST_TIME';
export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface Promotion {
  promotionId: string;
  code: string;
  title: string;
  description?: string;
  type: PromotionType;
  tier: PromotionTier;
  discountValue: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string; // LocalDate from backend
  endDate: string; // LocalDate from backend
  totalUsageLimit?: number;
  usagePerCustomerLimit?: number;
  currentUsageCount: number;
  status: PromotionStatus;
  isHighlighted: boolean;
  isActive: boolean; // Computed field from backend
  isExpired: boolean; // Computed field from backend
  createdAt: string;
  updatedAt: string;
}

export interface PromotionRequest {
  code: string;
  title: string;
  description?: string;
  type: PromotionType;
  tier: PromotionTier;
  discountValue: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  totalUsageLimit?: number;
  usagePerCustomerLimit?: number;
  status?: PromotionStatus;
  isHighlighted?: boolean;
}

export interface PromotionPageResponse {
  content: Promotion[];
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

// ============= SERVICE CLASS =============

class PromotionService {
  private baseUrl = '/promotions';

  /**
   * Get all promotions with pagination and filters
   */
  async getAllPromotions(
    page: number = 0,
    size: number = 20,
    status?: PromotionStatus,
    tier?: PromotionTier,
    isHighlighted?: boolean,
    search?: string,
    sortBy: string = 'createdAt',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<PromotionPageResponse> {
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
      if (tier) {
        params.append('tier', tier);
      }
      if (isHighlighted !== undefined) {
        params.append('isHighlighted', isHighlighted.toString());
      }
      if (search) {
        params.append('search', search);
      }

      const response = await axiosInstance.get<ApiResponse<PromotionPageResponse>>(
        `${this.baseUrl}?${params.toString()}`
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách khuyến mãi');
    }
  }

  /**
   * Get promotion by ID
   */
  async getPromotionById(promotionId: string): Promise<Promotion> {
    try {
      const response = await axiosInstance.get<ApiResponse<Promotion>>(
        `${this.baseUrl}/${promotionId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching promotion:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin khuyến mãi');
    }
  }

  /**
   * Get promotion by code
   */
  async getPromotionByCode(code: string): Promise<Promotion> {
    try {
      const response = await axiosInstance.get<ApiResponse<Promotion>>(
        `${this.baseUrl}/code/${code}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching promotion by code:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin khuyến mãi');
    }
  }

  /**
   * Create new promotion
   */
  async createPromotion(request: PromotionRequest): Promise<Promotion> {
    try {
      const response = await axiosInstance.post<ApiResponse<Promotion>>(
        this.baseUrl,
        request
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo khuyến mãi mới');
    }
  }

  /**
   * Update promotion
   */
  async updatePromotion(promotionId: string, request: PromotionRequest): Promise<Promotion> {
    try {
      const response = await axiosInstance.put<ApiResponse<Promotion>>(
        `${this.baseUrl}/${promotionId}`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating promotion:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật khuyến mãi');
    }
  }

  /**
   * Delete promotion
   */
  async deletePromotion(promotionId: string): Promise<void> {
    try {
      await axiosInstance.delete<ApiResponse<void>>(
        `${this.baseUrl}/${promotionId}`
      );
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa khuyến mãi');
    }
  }

  /**
   * Toggle promotion status
   */
  async toggleStatus(promotionId: string, status: PromotionStatus): Promise<Promotion> {
    try {
      const response = await axiosInstance.patch<ApiResponse<Promotion>>(
        `${this.baseUrl}/${promotionId}/status?status=${status}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error toggling promotion status:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái khuyến mãi');
    }
  }

  /**
   * Validate promotion code
   */
  async validatePromotionCode(
    code: string,
    customerId?: string,
    orderAmount?: number
  ): Promise<Promotion> {
    try {
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', customerId);
      if (orderAmount) params.append('orderAmount', orderAmount.toString());

      const response = await axiosInstance.get<ApiResponse<Promotion>>(
        `${this.baseUrl}/validate/${code}?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error validating promotion:', error);
      throw new Error(error.response?.data?.message || 'Mã khuyến mãi không hợp lệ');
    }
  }

  /**
   * Get promotion type label in Vietnamese
   */
  getTypeLabel(type: PromotionType): string {
    const labels: Record<PromotionType, string> = {
      PERCENTAGE: 'Giảm theo phần trăm',
      FIXED_AMOUNT: 'Giảm theo số tiền',
      FREE_SHIPPING: 'Miễn phí vận chuyển',
    };
    return labels[type] || type;
  }

  /**
   * Get promotion status label in Vietnamese
   */
  getStatusLabel(status: PromotionStatus): string {
    const labels: Record<PromotionStatus, string> = {
      ACTIVE: 'Đang hoạt động',
      INACTIVE: 'Không hoạt động',
    };
    return labels[status] || status;
  }

  /**
   * Get promotion status color class for badges
   */
  getStatusColorClass(status: PromotionStatus): string {
    const colors: Record<PromotionStatus, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get promotion tier label in Vietnamese
   */
  getTierLabel(tier: PromotionTier): string {
    const labels: Record<PromotionTier, string> = {
      GENERAL: 'Khuyến mãi chung',
      BRONZE_PLUS: 'Khuyến mãi Đồng+',
      SILVER_PLUS: 'Khuyến mãi Bạc+',
      GOLD_PLUS: 'Khuyến mãi Vàng+',
      PLATINUM_PLUS: 'Khuyến mãi Bạch Kim+',
      DIAMOND_ONLY: 'Khuyến mãi VIP Kim Cương',
      BIRTHDAY: 'Khuyến mãi sinh nhật',
      FIRST_TIME: 'Khuyến mãi lần đầu',
    };
    return labels[tier] || tier;
  }

  /**
   * Format discount value for display
   */
  formatDiscountValue(promotion: Promotion): string {
    switch (promotion.type) {
      case 'PERCENTAGE':
        return `${promotion.discountValue}%`;
      case 'FIXED_AMOUNT':
        return `${promotion.discountValue.toLocaleString('vi-VN')} đ`;
      case 'FREE_SHIPPING':
        return 'Miễn phí vận chuyển';
      default:
        return String(promotion.discountValue);
    }
  }
}

export default new PromotionService();
