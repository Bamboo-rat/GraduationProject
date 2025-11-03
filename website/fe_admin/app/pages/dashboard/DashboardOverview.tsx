import { useEffect, useState } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import dashboardService, {
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
  XCircle
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
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!overview) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">Không có dữ liệu</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan hệ thống</h1>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Tổng doanh thu</h3>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{formatCurrency(overview.totalRevenue)}</p>
            <div className="text-sm opacity-90">
              Tháng này: {formatCurrency(overview.monthRevenue)}
            </div>
            <div className="mt-2 text-sm font-medium">
              {formatGrowthRate(overview.revenueGrowthRate)}
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Tổng đơn hàng</h3>
              <ShoppingCart className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{overview.totalOrders.toLocaleString()}</p>
            <div className="text-sm opacity-90">
              Đang xử lý: {overview.pendingOrders + overview.confirmedOrders + overview.preparingOrders + overview.shippingOrders}
            </div>
            <div className="mt-2 text-sm font-medium">
              {formatGrowthRate(overview.orderGrowthRate)}
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Khách hàng</h3>
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{overview.totalCustomers.toLocaleString()}</p>
            <div className="text-sm opacity-90">
              Đối tác: {overview.totalSuppliers}
            </div>
            <div className="mt-2 text-sm font-medium">
              {formatGrowthRate(overview.customerGrowthRate)}
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Sản phẩm</h3>
              <Package className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{overview.activeProducts.toLocaleString()}</p>
            <div className="text-sm opacity-90">
              Cửa hàng: {overview.totalStores}
            </div>
            <div className="mt-2 text-sm">
              <span className="text-yellow-200">Sắp hết: {overview.lowStockProducts}</span>
            </div>
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Trạng thái đơn hàng</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Chờ xử lý</p>
                <p className="text-xl font-bold text-yellow-600">{overview.pendingOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Đã xác nhận</p>
                <p className="text-xl font-bold text-blue-600">{overview.confirmedOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <Package className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Đang chuẩn bị</p>
                <p className="text-xl font-bold text-purple-600">{overview.preparingOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-indigo-50 rounded-lg">
              <Truck className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Đang giao</p>
                <p className="text-xl font-bold text-indigo-600">{overview.shippingOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Đã giao</p>
                <p className="text-xl font-bold text-green-600">{overview.deliveredOrders}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Đã hủy</p>
                <p className="text-xl font-bold text-red-600">{overview.cancelledOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products and Category Revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Top 5 sản phẩm bán chạy</h2>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">#{index + 1}</span>
                  </div>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
                    <p className="text-xs text-gray-500">{product.categoryName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-gray-500">{product.totalSold} đã bán</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Doanh thu theo danh mục</h2>
            <div className="space-y-3">
              {categoryRevenue.slice(0, 5).map((category, index) => (
                <div key={category.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{category.categoryName}</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(category.revenue)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${category.revenuePercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {category.revenuePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
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
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Cảnh báo tồn kho</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>• {overview.lowStockProducts} sản phẩm sắp hết hàng (dưới 10 sản phẩm)</p>
                  <p>• {overview.outOfStockProducts} sản phẩm đã hết hàng</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Trends - Simple Table View */}
        {salesTrends.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Xu hướng bán hàng (30 ngày gần nhất)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doanh thu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá trị TB
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesTrends.slice(-7).reverse().map((trend) => (
                    <tr key={trend.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(trend.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trend.orderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(trend.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
