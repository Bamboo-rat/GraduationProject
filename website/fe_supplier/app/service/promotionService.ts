import axiosInstance from '../config/axios';

// ============= TYPES =============

export type PromotionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SCHEDULED';
export type PromotionTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface Promotion {
  promotionId: string;
  code: string;
  description?: string;
  type: PromotionType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  tier: PromotionTier;
  status: PromotionStatus;
  isHighlighted: boolean;
  applicableCategories: string[];
  createdAt: string;
  updatedAt: string;
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

/**
 * Promotion Service for Supplier Portal
 * Suppliers can view and apply promotions (read-only access)
 */
class PromotionService {
  private baseUrl = '/promotions';

  /**
   * Get all promotions with pagination and filters (public endpoint)
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
   * Get promotion by ID (public endpoint)
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
   * Get promotion by code (public endpoint)
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
   * Validate promotion code (preview only, doesn't increment usage)
   * Use this to check if a promotion is valid before applying it
   * Requires authentication
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
   * Apply promotion to order (increments usage count)
   * This should be called when creating the order
   * NOTE: This is an atomic operation with race condition protection
   * Requires authentication (SUPPLIER or CUSTOMER)
   */
  async applyPromotionToOrder(
    code: string,
    customerId: string,
    orderAmount: number
  ): Promise<Promotion> {
    try {
      const params = new URLSearchParams();
      params.append('customerId', customerId);
      params.append('orderAmount', orderAmount.toString());

      const response = await axiosInstance.post<ApiResponse<Promotion>>(
        `${this.baseUrl}/apply/${code}?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error applying promotion:', error);
      throw new Error(error.response?.data?.message || 'Không thể áp dụng mã khuyến mãi');
    }
  }

  // ============= UTILITY METHODS =============

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
      EXPIRED: 'Đã hết hạn',
      SCHEDULED: 'Đã lên lịch',
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
      EXPIRED: 'bg-red-100 text-red-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get promotion tier label in Vietnamese
   */
  getTierLabel(tier: PromotionTier): string {
    const labels: Record<PromotionTier, string> = {
      TIER_1: 'Hạng 1',
      TIER_2: 'Hạng 2',
      TIER_3: 'Hạng 3',
      TIER_4: 'Hạng 4',
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
        return `${promotion.discountValue.toLocaleString('vi-VN')}đ`;
      case 'FREE_SHIPPING':
        return 'Miễn phí vận chuyển';
      default:
        return String(promotion.discountValue);
    }
  }

  /**
   * Calculate discount amount based on order amount
   */
  calculateDiscountAmount(promotion: Promotion, orderAmount: number): number {
    let discount = 0;

    switch (promotion.type) {
      case 'PERCENTAGE':
        discount = (orderAmount * promotion.discountValue) / 100;
        if (promotion.maxDiscountAmount && discount > promotion.maxDiscountAmount) {
          discount = promotion.maxDiscountAmount;
        }
        break;
      case 'FIXED_AMOUNT':
        discount = promotion.discountValue;
        break;
      case 'FREE_SHIPPING':
        // Shipping discount is handled separately
        discount = 0;
        break;
    }

    return discount;
  }

  /**
   * Check if promotion is currently valid
   */
  isPromotionValid(promotion: Promotion): boolean {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    return (
      promotion.status === 'ACTIVE' &&
      now >= startDate &&
      now <= endDate &&
      (!promotion.usageLimit || promotion.usageCount < promotion.usageLimit)
    );
  }
}

export default new PromotionService();
