import axiosInstance from '../config/axios';

// ============= TYPES =============

export interface PartnerPerformanceMetrics {
  supplierId: string;
  businessName: string;
  avatarUrl?: string;

  // Store metrics
  totalStores: number;
  activeStores: number; // Store.status = ACTIVE
  inactiveStores: number;

  // Product metrics
  totalProducts: number;
  activeProducts: number; // Product.status = ACTIVE or AVAILABLE
  outOfStockProducts: number;

  // Order metrics
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  orderCompletionRate: number; // Percentage
  orderCancellationRate: number; // Percentage

  // Revenue metrics (to be implemented later)
  totalRevenue?: number;
  commission?: number;

  // Time period
  periodStart?: string;
  periodEnd?: string;

  // Last updated
  lastUpdated: string;
}

export interface PartnerPerformanceSummary {
  totalPartners: number;
  activePartners: number; // Supplier.status = ACTIVE
  inactivePartners: number;
  suspendedPartners: number;

  totalStores: number;
  totalActiveStores: number;

  totalProducts: number;
  totalActiveProducts: number;

  totalOrders: number;
  totalCompletedOrders: number;
  totalCancelledOrders: number;

  averageCompletionRate: number;
  averageCancellationRate: number;

  // Revenue summary (to be implemented later)
  totalRevenue?: number;
  totalCommission?: number;
}

export interface PartnerPerformancePageResponse {
  content: PartnerPerformanceMetrics[];
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

class PartnerPerformanceService {
  private baseUrl = '/partners/performance';

  /**
   * Get performance summary for all partners
   */
  async getPerformanceSummary(): Promise<PartnerPerformanceSummary> {
    try {
      const response = await axiosInstance.get<ApiResponse<PartnerPerformanceSummary>>(
        `${this.baseUrl}/summary`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching performance summary:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải tổng quan hiệu suất');
    }
  }

  /**
   * Get performance metrics for all partners with pagination
   */
  async getAllPartnerPerformance(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'totalOrders',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<PartnerPerformancePageResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDirection,
      });

      const response = await axiosInstance.get<ApiResponse<PartnerPerformancePageResponse>>(
        `${this.baseUrl}?${params.toString()}`
      );

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching partner performance:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách hiệu suất đối tác');
    }
  }

  /**
   * Get performance metrics for a specific partner
   */
  async getPartnerPerformance(supplierId: string): Promise<PartnerPerformanceMetrics> {
    try {
      const response = await axiosInstance.get<ApiResponse<PartnerPerformanceMetrics>>(
        `${this.baseUrl}/${supplierId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching partner performance:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải báo cáo hiệu suất');
    }
  }

  /**
   * Get performance metrics for a time period
   * Date format: ISO 8601 (e.g., "2025-01-01T00:00:00")
   */
  async getPartnerPerformanceByPeriod(
    supplierId: string,
    startDate: string,
    endDate: string
  ): Promise<PartnerPerformanceMetrics> {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await axiosInstance.get<ApiResponse<PartnerPerformanceMetrics>>(
        `${this.baseUrl}/${supplierId}/period?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching partner performance by period:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải báo cáo hiệu suất');
    }
  }

  /**
   * Calculate completion rate percentage
   */
  calculateCompletionRate(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  /**
   * Calculate cancellation rate percentage
   */
  calculateCancellationRate(cancelled: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((cancelled / total) * 100);
  }

  /**
   * Get rating color based on completion rate
   */
  getRatingColor(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Get rating label based on completion rate
   */
  getRatingLabel(rate: number): string {
    if (rate >= 90) return 'Xuất sắc';
    if (rate >= 75) return 'Tốt';
    if (rate >= 50) return 'Trung bình';
    return 'Cần cải thiện';
  }

  /**
   * Format number with thousand separators
   */
  formatNumber(num: number): string {
    return num.toLocaleString('vi-VN');
  }

  /**
   * Format currency (VND)
   */
  formatCurrency(amount: number): string {
    return amount.toLocaleString('vi-VN') + ' đ';
  }

  /**
   * Convert sorting field name to backend format
   */
  private convertSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      'totalOrders': 'totalOrders',
      'completedOrders': 'completedOrders',
      'orderCompletionRate': 'orderCompletionRate',
      'orderCancellationRate': 'orderCancellationRate',
      'totalStores': 'totalStores',
      'activeStores': 'activeStores',
      'totalProducts': 'totalProducts',
      'activeProducts': 'activeProducts',
      'businessName': 'businessName',
    };
    return fieldMap[sortBy] || 'totalOrders';
  }
}

export default new PartnerPerformanceService();
