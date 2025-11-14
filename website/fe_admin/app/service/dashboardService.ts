import axiosInstance from '../config/axios';

export interface DashboardOverview {
  totalOrders: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalProducts: number;
  totalStores: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  preparingOrders: number;
  shippingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenueGrowthRate: number;
  orderGrowthRate: number;
  customerGrowthRate: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface SalesTrend {
  date: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  categoryName: string;
  supplierName: string;
  totalSold: number;
  revenue: number;
  imageUrl: string | null;
}

export interface CategoryRevenue {
  categoryId: string;
  categoryName: string;
  revenue: number;
  orderCount: number;
  productCount: number;
  revenuePercentage: number;
}

export interface TopStore {
  storeId: string;
  storeName: string;
  supplierName: string;
  orderCount: number;
  revenue: number;
}

class DashboardService {
  /**
   * Get dashboard overview metrics
   */
  async getOverview(): Promise<DashboardOverview> {
    const response = await axiosInstance.get('/dashboard/overview');
    return response.data.data;
  }

  /**
   * Get sales trends by date range
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   */
  async getSalesTrends(startDate?: string, endDate?: string): Promise<SalesTrend[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axiosInstance.get('/dashboard/sales-trends', { params });
    return response.data.data;
  }

  /**
   * Get top products by revenue
   * @param limit Number of products to return (default: 10)
   */
  async getTopProducts(limit: number = 10): Promise<TopProduct[]> {
    const response = await axiosInstance.get('/dashboard/top-products', {
      params: { limit }
    });
    return response.data.data;
  }

  /**
   * Get revenue breakdown by category
   */
  async getCategoryRevenue(): Promise<CategoryRevenue[]> {
    const response = await axiosInstance.get('/dashboard/category-revenue');
    return response.data.data;
  }

  /**
   * Get top stores by revenue
   * @param limit Number of stores to return (default: 10)
   */
  async getTopStores(limit: number = 10): Promise<TopStore[]> {
    const response = await axiosInstance.get('/dashboard/top-stores', {
      params: { limit }
    });
    return response.data.data;
  }
}

export default new DashboardService();
