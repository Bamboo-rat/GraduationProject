import axiosInstance from '~/config/axios';

// ==================== TYPE DEFINITIONS ====================

export interface RevenueSummary {
  startDate: string;
  endDate: string;
  
  // New detailed breakdown
  totalGMV: number;  // Total GMV (Gross Merchandise Value)
  totalProductRevenue: number;  // Product revenue only
  totalShippingFee: number;  // Total shipping fees
  totalPlatformRevenue: number;  // Platform's actual revenue (commission + shipping)
  totalSupplierEarnings: number;  // Supplier's gross earnings
  
  // Legacy fields (backward compatible)
  totalRevenue: number;  // Same as totalGMV
  totalCommission: number;  // Product commission only
  
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;  // Average GMV per order
  averageDailyRevenue: number;
  averageCommissionRate: number;  // Average commission rate
  revenueGrowthRate: number;
  orderGrowthRate: number;
  topSupplierName: string;
  topSupplierRevenue: number;
  topCategoryName: string;
  topCategoryRevenue: number;
}

export interface RevenueBySupplier {
  supplierId: string;
  supplierName: string;
  avatarUrl: string;
  totalOrders: number;
  
  // New detailed breakdown
  totalGMV: number;
  totalProductRevenue: number;
  totalShippingFee: number;
  platformCommission: number;  // Includes shipping
  supplierEarnings: number;
  
  // Legacy
  totalRevenue: number;  // Same as totalGMV
  
  revenuePercentage: number;
  productCount: number;
  storeCount: number;
  commissionRate: number;  // Supplier's commission rate
}

export interface RevenueByCategory {
  categoryId: string;
  categoryName: string;
  categoryImageUrl: string;
  totalOrders: number;
  totalProductsSold: number;
  totalRevenue: number;
  revenuePercentage: number;
  averageOrderValue: number;
}

export interface RevenueTimeSeries {
  date: string;
  orderCount: number;
  revenue: number;
  platformCommission: number;
  averageOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
}

export interface CustomerBehaviorSummary {
  startDate: string;
  endDate: string;
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  suspendedCustomers: number;
  bannedCustomers: number;
  returnRate: number;
  activeCustomerRate: number;
  repeatPurchaseRate: number;
  customerRetentionRate: number;
  customerChurnRate: number;
  averageCustomerLifetimeValue: number;
  averageOrderValue: number;
  averageOrdersPerCustomer: number;
  totalCustomerValue: number;
  bronzeTierCount: number;
  silverTierCount: number;
  goldTierCount: number;
  platinumTierCount: number;
  diamondTierCount: number;
}

export interface CustomerSegmentation {
  tier: string;
  customerCount: number;
  customerPercentage: number;
  totalRevenue: number;
  revenuePercentage: number;
  averageOrderValue: number;
  averageOrdersPerCustomer: number;
  totalOrders: number;
}

export interface CustomerLifetimeValue {
  customerId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  tier: string;
  registeredAt: string;
  totalSpent: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  daysSinceRegistration: number;
  daysSinceLastOrder: number;
  orderFrequency: number;
  repeatPurchaseRate: number;
  favoriteStoreCount: number;
  predictedLifetimeValue: number;
  customerSegment: string;
}

export interface PurchasePattern {
  period: string;
  orderCount: number;
  orderPercentage: number;
  dayOfWeek: string;
  averageOrderValue: number;
  topCategoryName: string;
  categoryOrderCount: number;
  totalReturns: number;
  returnRate: number;
  topReturnReason: string;
  repeatCustomers: number;
  oneTimeCustomers: number;
  repeatCustomerRate: number;
  averageDaysBetweenOrders: number;
}

export interface WasteSummary {
  startDate: string;
  endDate: string;
  // NEW DEFINITION - Core waste metrics
  totalListed: number;     // Tổng số lượng đã niêm yết
  totalSold: number;       // Tổng số lượng đã bán
  totalUnsold: number;     // Tổng số lượng chưa bán
  // Legacy fields
  totalProducts: number;
  activeProducts: number;
  soldOutProducts: number;
  expiredProducts: number;
  nearExpiryProducts: number;
  totalStockQuantity: number;
  soldQuantity: number;
  unsoldQuantity: number;
  expiredQuantity: number;
  totalStockValue: number;
  soldValue: number;
  unsoldValue: number;
  wasteValue: number;
  potentialRevenueLoss: number;
  sellThroughRate: number;
  wasteRate: number;
  expiryRate: number;
  overallWasteIndex: number;
  wasteRateChange: number;
  wasteRateTrend: string;
  topWasteCategoryName: string;
  topWasteCategoryValue: number;
  topWasteSupplierName: string;
  topWasteSupplierValue: number;
}

export interface UnsoldInventory {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  categoryName: string;
  supplierName: string;
  storeName: string;
  currentStock: number;
  initialStock: number;
  soldQuantity: number;
  expiryDate: string;
  daysUntilExpiry: number;
  originalPrice: number;
  discountPrice: number;
  potentialRevenueLoss: number;
  estimatedWasteValue: number;
  wasteRiskLevel: string;
  productStatus: string;
  isNearExpiry: boolean;
}

export interface WasteByCategory {
  categoryId: string;
  categoryName: string;
  categoryImageUrl: string;
  totalProducts: number;
  unsoldProducts: number;
  expiredProducts: number;
  nearExpiryProducts: number;
  totalStockQuantity: number;
  unsoldQuantity: number;
  expiredQuantity: number;
  totalStockValue: number;
  unsoldValue: number;
  wasteValue: number;
  wasteRate: number;
  expiryRate: number;
  wasteIndex: number;
}

export interface WasteBySupplier {
  supplierId: string;
  supplierName: string;
  avatarUrl: string;
  totalProducts: number;
  activeProducts: number;
  unsoldProducts: number;
  expiredProducts: number;
  totalStores: number;
  activeStores: number;
  totalStockQuantity: number;
  soldQuantity: number;
  unsoldQuantity: number;
  expiredQuantity: number;
  totalRevenue: number;
  potentialRevenueLoss: number;
  wasteValue: number;
  sellThroughRate: number;
  wasteRate: number;
  wasteIndex: number;
  performanceRating: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ==================== SERVICE CLASS ====================

class ReportService {
  // ==================== REVENUE REPORTS ====================

  async getRevenueSummary(startDate: string, endDate: string): Promise<RevenueSummary> {
    const response = await axiosInstance.get('/reports/revenue/summary', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async getRevenueBySupplier(startDate: string, endDate: string): Promise<RevenueBySupplier[]> {
    const response = await axiosInstance.get('/reports/revenue/by-supplier', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async getRevenueByCategory(startDate: string, endDate: string): Promise<RevenueByCategory[]> {
    const response = await axiosInstance.get('/reports/revenue/by-category', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async getRevenueTimeSeries(startDate: string, endDate: string): Promise<RevenueTimeSeries[]> {
    const response = await axiosInstance.get('/reports/revenue/time-series', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async exportRevenueReport(startDate: string, endDate: string): Promise<Blob> {
    const response = await axiosInstance.get('/reports/revenue/export', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  }

  // ==================== CUSTOMER BEHAVIOR REPORTS ====================

  async getCustomerBehaviorSummary(startDate: string, endDate: string): Promise<CustomerBehaviorSummary> {
    const response = await axiosInstance.get('/reports/customer-behavior/summary', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async getCustomerSegmentation(startDate: string, endDate: string): Promise<CustomerSegmentation[]> {
    const response = await axiosInstance.get('/reports/customer-behavior/segmentation', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async getCustomerLifetimeValue(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'totalSpent',
    sortDirection: string = 'DESC',
    startDate?: string,
    endDate?: string
  ): Promise<PageResponse<CustomerLifetimeValue>> {
    const response = await axiosInstance.get('/reports/customer-behavior/lifetime-value', {
      params: { page, size, sortBy, sortDirection, startDate, endDate }
    });
    return response.data.data;
  }

  async getPurchasePatterns(startDate: string, endDate: string): Promise<PurchasePattern> {
    const response = await axiosInstance.get('/reports/customer-behavior/patterns', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async exportCustomerBehaviorReport(startDate: string, endDate: string): Promise<Blob> {
    const response = await axiosInstance.get('/reports/customer-behavior/export', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  }

  // ==================== WASTE REPORTS ====================

  async getWasteSummary(startDate?: string, endDate?: string): Promise<WasteSummary> {
    const response = await axiosInstance.get('/reports/waste/summary', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async getUnsoldInventory(page: number = 0, size: number = 20, startDate?: string, endDate?: string): Promise<PageResponse<UnsoldInventory>> {
    const response = await axiosInstance.get('/reports/waste/unsold-inventory', {
      params: { page, size, startDate, endDate }
    });
    return response.data.data;
  }

  async getWasteByCategory(startDate?: string, endDate?: string): Promise<WasteByCategory[]> {
    const response = await axiosInstance.get('/reports/waste/by-category', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async getWasteBySupplier(startDate?: string, endDate?: string): Promise<WasteBySupplier[]> {
    const response = await axiosInstance.get('/reports/waste/by-supplier', {
      params: { startDate, endDate }
    });
    return response.data.data;
  }

  async exportWasteReport(startDate?: string, endDate?: string): Promise<Blob> {
    const response = await axiosInstance.get('/reports/waste/export', {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  }

  // ==================== UTILITY METHODS ====================

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getDefaultDateRange(days: number = 30): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }
}

export default new ReportService();
