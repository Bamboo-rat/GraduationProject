import { useEffect, useState } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import dashboardService from '~/service/dashboardService';
import type {
  DashboardOverview as DashboardOverviewType,
  SalesTrend,
  TopProduct,
  CategoryRevenue
} from '~/service/dashboardService';
import Toast from '~/component/common/Toast';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  Package,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function DashboardOverview() {
  const [overview, setOverview] = useState<DashboardOverviewType | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all dashboard data in parallel
      const [overviewData, trendsData, productsData, categoryData] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getSalesTrends(),
        dashboardService.getTopProducts(5),
        dashboardService.getCategoryRevenue()
      ]);

      setOverview(overviewData);
      setSalesTrends(trendsData);
      setTopProducts(productsData);
      setCategoryRevenue(categoryData);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setToast({
        message: error.response?.data?.message || 'Không thể tải dữ liệu dashboard',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const formatGrowthRate = (rate: number) => {
    const isPositive = rate >= 0;
    return (
      <span className={`flex items-center text-sm font-medium ${isPositive ? 'text-[#2F855A]' : 'text-[#E63946]'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {Math.abs(rate).toFixed(2)}%
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F855A]"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!overview) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-muted">Không có dữ liệu</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="heading-primary mb-2">Tổng quan hệ thống</h1>
          <p className="text-muted">Thống kê và phân tích hiệu suất kinh doanh</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="card card-hover p-6 bg-gradient-to-br from-[#2F855A] to-[#8FB491] text-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Tổng doanh thu</h3>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-2xl font-bold mb-2">{formatCurrency(overview.totalRevenue)}</p>
            <div className="text-sm opacity-90 mb-3">
              Tháng này: {formatCurrency(overview.monthRevenue)}
            </div>
            {formatGrowthRate(overview.revenueGrowthRate)}
          </div>

          {/* Total Orders */}
          <div className="card card-hover p-6 bg-gradient-to-br from-[#A4C3A2] to-[#B7E4C7] text-text">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Tổng đơn hàng</h3>
              <ShoppingCart className="w-8 h-8" />
            </div>
            <p className="text-2xl font-bold mb-2">{overview.totalOrders.toLocaleString()}</p>
            <div className="text-sm text-muted mb-3">
              Đang xử lý: {overview.pendingOrders + overview.confirmedOrders + overview.preparingOrders + overview.shippingOrders}
            </div>
            {formatGrowthRate(overview.orderGrowthRate)}
          </div>

          {/* Total Customers */}
          <div className="card card-hover p-6 bg-gradient-to-br from-[#DDC6B6] to-[#F5EDE6] text-text">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Khách hàng</h3>
              <Users className="w-8 h-8" />
            </div>
            <p className="text-2xl font-bold mb-2">{overview.totalCustomers.toLocaleString()}</p>
            <div className="text-sm text-muted mb-3">
              Đối tác: {overview.totalSuppliers}
            </div>
            {formatGrowthRate(overview.customerGrowthRate)}
          </div>

          {/* Total Products
          <div className="card card-hover p-6 bg-gradient-to-br from-[#FFE8E8] to-[#FFD1D1] text-text border border-[#FF6B35]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Sản phẩm</h3>
              <Package className="w-8 h-8 text-[#E63946]" />
            </div>
            <p className="text-2xl font-bold mb-2">{overview.activeProducts.toLocaleString()}</p>
            <div className="text-sm text-muted mb-3">
              Cửa hàng: {overview.totalStores}
            </div>
            <div className="text-sm font-medium">
              <span className="text-[#E63946]">Sắp hết: {overview.lowStockProducts}</span>
            </div>
          </div> */}
        </div>

        {/* Order Status Overview */}
        <div className="card mb-8 p-6">
          <h2 className="heading-secondary mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Trạng thái đơn hàng
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-[#FFF8E1] rounded-lg border border-[#FF6B35]">
              <Clock className="w-6 h-6 text-[#FF6B35]" />
              <div>
                <p className="text-sm text-muted">Chờ xử lý</p>
                <p className="text-xl font-bold text-[#FF6B35]">{overview.pendingOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-[#E8FFED] rounded-lg border border-[#2F855A]">
              <CheckCircle className="w-6 h-6 text-[#2F855A]" />
              <div>
                <p className="text-sm text-muted">Đã xác nhận</p>
                <p className="text-xl font-bold text-[#2F855A]">{overview.confirmedOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-[#F0E8FF] rounded-lg border border-[#A4C3A2]">
              <Package className="w-6 h-6 text-[#A4C3A2]" />
              <div>
                <p className="text-sm text-muted">Đang chuẩn bị</p>
                <p className="text-xl font-bold text-[#A4C3A2]">{overview.preparingOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-[#E8F4FF] rounded-lg border border-[#8FB491]">
              <Truck className="w-6 h-6 text-[#8FB491]" />
              <div>
                <p className="text-sm text-muted">Đang giao</p>
                <p className="text-xl font-bold text-[#8FB491]">{overview.shippingOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-[#E8FFED] rounded-lg border border-[#2F855A]">
              <CheckCircle className="w-6 h-6 text-[#2F855A]" />
              <div>
                <p className="text-sm text-muted">Đã giao</p>
                <p className="text-xl font-bold text-[#2F855A]">{overview.deliveredOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-[#FFE8E8] rounded-lg border border-[#E63946]">
              <XCircle className="w-6 h-6 text-[#E63946]" />
              <div>
                <p className="text-sm text-muted">Đã hủy</p>
                <p className="text-xl font-bold text-[#E63946]">{overview.cancelledOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products and Category Revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <div className="card p-6">
            <h2 className="heading-secondary mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Top 5 sản phẩm bán chạy
            </h2>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center space-x-4 p-4 bg-surface-light rounded-lg border border-default transition-all hover:border-[#A4C3A2] group"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-[#FF6B35] text-surface' :
                    index === 1 ? 'bg-[#2F855A] text-surface' :
                      index === 2 ? 'bg-[#A4C3A2] text-text' :
                        'bg-[#F5EDE6] text-text'
                    }`}>
                    #{index + 1}
                  </div>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="w-12 h-12 object-cover rounded-lg border border-default"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{product.productName}</p>
                    <p className="text-xs text-muted">{product.categoryName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#2F855A]">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-muted">{product.totalSold} đã bán</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Revenue */}
          <div className="card p-6">
            <h2 className="heading-secondary mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Doanh thu theo danh mục
            </h2>
            <div className="space-y-5">
              {categoryRevenue.slice(0, 5).map((category, index) => (
                <div key={category.categoryId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text">{category.categoryName}</span>
                    <span className="text-sm font-bold text-[#2F855A]">{formatCurrency(category.revenue)}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-surface-light rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{
                          width: `${category.revenuePercentage}%`,
                          background: `linear-gradient(90deg, #2F855A, #8FB491)`
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted w-12 text-right">
                      {category.revenuePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-light">
                    <span>{category.orderCount} đơn hàng</span>
                    <span>•</span>
                    <span>{category.productCount} sản phẩm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Alerts */}
        {(overview.lowStockProducts > 0 || overview.outOfStockProducts > 0) && (
          <div className="card mb-8 p-6 border-l-4 border-[#FF6B35] bg-[#FFF8E1]">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-[#FF6B35] mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-[#FF6B35] mb-2">Cảnh báo tồn kho</h3>
                <div className="text-sm text-[#8B4513] space-y-1">
                  <p>• {overview.lowStockProducts} sản phẩm sắp hết hàng (dưới 10 sản phẩm)</p>
                  <p>• {overview.outOfStockProducts} sản phẩm đã hết hàng</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Trends */}
        {salesTrends.length > 0 && (
          <div className="card p-6">
            <h2 className="heading-secondary mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Xu hướng bán hàng (7 ngày gần nhất)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#B7E4C7]">
                <thead className="bg-surface-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text uppercase tracking-wider">
                      Ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text uppercase tracking-wider">
                      Số đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text uppercase tracking-wider">
                      Doanh thu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-text uppercase tracking-wider">
                      Giá trị TB
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-[#B7E4C7]">
                  {salesTrends.slice(-7).reverse().map((trend) => (
                    <tr key={trend.date} className="hover:bg-surface-light transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {new Date(trend.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        {trend.orderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#2F855A]">
                        {formatCurrency(trend.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        {formatCurrency(trend.averageOrderValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}