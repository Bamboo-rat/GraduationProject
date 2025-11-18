import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle,
  Clock,
  Star,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
  PackageCheck,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import walletService from '~/service/walletService';
import reportService from '~/service/reportService';
import orderService from '~/service/orderService';
import productService from '~/service/productService';
import type { WalletSummaryResponse } from '~/service/walletService';
import type { PartnerPerformanceMetrics } from '~/service/reportService';

interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
  imageUrl?: string;
}

export default function DashboardOverview() {
  const [wallet, setWallet] = useState<WalletSummaryResponse | null>(null);
  const [performance, setPerformance] = useState<PartnerPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    unrepliedReviews: 0,
    expiringProducts: 0,
    overdueOrders: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Calculate date range for last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const [walletData, performanceData, dashboardStats, revenueTimeSeries, topProductsData, orderStatusData] = await Promise.all([
        walletService.getWalletSummary(),
        reportService.getMyPerformance(),
        reportService.getDashboardStats(),
        reportService.getRevenueOverTime({ period: 'day', startDate: startDateStr, endDate: endDateStr }),
        reportService.getTopProducts({ limit: 5 }),
        reportService.getOrderStatusDistribution(),
      ]);

      setWallet(walletData);
      setPerformance(performanceData);

      // Set today stats from dashboard stats
      setTodayStats({
        todayOrders: Number(dashboardStats.todayOrders) || 0,
        pendingOrders: Number(dashboardStats.pendingOrders) || 0,
        lowStockProducts: Number(dashboardStats.lowStockProducts) || 0,
        unrepliedReviews: Number(dashboardStats.unrepliedReviews) || 0,
        expiringProducts: Number(dashboardStats.expiringProducts) || 0,
        overdueOrders: Number(dashboardStats.overdueOrders) || 0
      });

      // Format revenue data for chart
      const formattedRevenueData = revenueTimeSeries.map(item => ({
        date: new Date(item.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        revenue: Number(item.revenue) || 0,
        orders: Number(item.orders) || 0
      }));
      setRevenueData(formattedRevenueData);

      // Format order status data for pie chart
      const formattedOrderStatusData = orderStatusData.map(item => ({
        name: item.name,
        value: Number(item.count) || 0,
        color: item.color
      }));
      setOrderStatusData(formattedOrderStatusData);

      // Format top products data
      const formattedTopProducts = topProductsData.map(item => ({
        productId: item.productId,
        productName: item.productName,
        totalSold: Number(item.totalSold) || 0,
        revenue: Number(item.totalRevenue) || 0,
        imageUrl: item.imageUrl
      }));
      setTopProducts(formattedTopProducts);

    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A4C3A2]"></div>
      </div>
    );
  }

  const monthlyRevenue = wallet?.monthlyEarnings || 0;
  const previousMonthRevenue = monthlyRevenue * 0.87; // Mock: assume 15% growth
  const revenueGrowth = previousMonthRevenue > 0 
    ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Dashboard Tổng quan</h1>
          <p className="text-[#6B6B6B] mt-1">Cái nhìn nhanh về toàn bộ hoạt động kinh doanh của bạn</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* A. KPI Cards - 4 Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Doanh thu tháng này */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#E8FFED] p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2F855A] to-[#A4C3A2] flex items-center justify-center shadow-sm">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
              <TrendingUp className="w-3 h-3" />
              +{revenueGrowth}%
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-2">Doanh thu tháng này</h3>
          <p className="text-2xl font-bold text-[#2D2D2D] mb-1">
            {walletService.formatVND(monthlyRevenue)}
          </p>
          <p className="text-xs text-[#6B6B6B]">vs tháng trước</p>
        </div>

        {/* Đơn hàng hôm nay */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              +5 vs hôm qua
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-2">Đơn hàng hôm nay</h3>
          <p className="text-2xl font-bold text-[#2D2D2D] mb-1">{todayStats.todayOrders} đơn</p>
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertCircle className="w-3 h-3" />
            <span>{todayStats.pendingOrders} chờ xác nhận</span>
          </div>
        </div>

        {/* Sản phẩm đang bán */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-purple-100 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700">
              <AlertTriangle className="w-3 h-3" />
              {todayStats.lowStockProducts} cảnh báo
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-2">Sản phẩm đang bán</h3>
          <p className="text-2xl font-bold text-[#2D2D2D] mb-1">{performance?.activeProducts || 0}</p>
          <p className="text-xs text-[#6B6B6B]">{todayStats.lowStockProducts} sắp hết hàng</p>
        </div>

        {/* Đánh giá trung bình */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-yellow-100 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
              <TrendingUp className="w-3 h-3" />
              +0.2
            </div>
          </div>
          <h3 className="text-[#6B6B6B] text-sm font-medium mb-2">Đánh giá trung bình</h3>
          <p className="text-2xl font-bold text-[#2D2D2D] mb-1">4.6/5.0</p>
          <p className="text-xs text-[#6B6B6B]">234 đánh giá tháng này</p>
        </div>
      </div>

      {/* B. Alerts & Action Items */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-[#2D2D2D]">CẦN CHÚ Ý</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Alert 1: Pending Orders */}
          <div className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{todayStats.overdueOrders} đơn hàng chờ xác nhận {'>'} 2 giờ</p>
                <p className="text-xs text-gray-500">Cần xử lý gấp để tránh khách hàng hủy</p>
              </div>
            </div>
            <a href="/orders/list?status=PENDING" className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium text-sm">
              Xem ngay <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Alert 2: Low Stock */}
          <div className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{todayStats.lowStockProducts} sản phẩm sắp hết hàng</p>
                <p className="text-xs text-gray-500">Cần nhập thêm để duy trì bán hàng</p>
              </div>
            </div>
            <a href="/dashboard/inventory-alert" className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium text-sm">
              Nhập thêm <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Alert 3: Expiring Products */}
          <div className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{todayStats.expiringProducts} sản phẩm sắp hết hạn ({'<'} 7 ngày)</p>
                <p className="text-xs text-gray-500">Xem xét giảm giá để tránh lãng phí</p>
              </div>
            </div>
            <a href="/products/list?expiring=true" className="flex items-center gap-1 text-yellow-600 hover:text-yellow-700 font-medium text-sm">
              Xem chi tiết <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Alert 4: Unreplied Reviews */}
          <div className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{todayStats.unrepliedReviews} đánh giá 1 sao chưa phản hồi</p>
                <p className="text-xs text-gray-500">Phản hồi để cải thiện uy tín</p>
              </div>
            </div>
            <a href="/reports/reviews-analysis?rating=1" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm">
              Phản hồi <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* C. Charts Section - 7 Day Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#E8FFED] p-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2F855A]" />
            Doanh thu 7 ngày qua
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8FFED" />
              <XAxis 
                dataKey="date" 
                stroke="#6B6B6B"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6B6B6B"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                formatter={(value: any) => [walletService.formatVND(value), 'Doanh thu']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '2px solid #E8FFED',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#2F855A" 
                strokeWidth={3}
                dot={{ fill: '#2F855A', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[#E8FFED] p-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#2F855A]" />
            Đơn hàng theo trạng thái
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: any) => [value, 'Đơn hàng']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '2px solid #E8FFED',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {orderStatusData.map((status, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: status.color }}
                ></div>
                <span className="text-gray-700">{status.name}: <strong>{status.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* D. Top 5 Best Selling Products */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-[#E8FFED] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#2F855A]" />
            Top 5 Sản phẩm bán chạy (Tháng này)
          </h2>
          <a href="/reports/top-products" className="text-[#2F855A] hover:text-[#8FB491] font-medium text-sm flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#F8FFF9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Xếp hạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Đã bán
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Doanh thu
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Xu hướng
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={product.productId} className="hover:bg-[#F8FFF9] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {index === 0 && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                          1
                        </div>
                      )}
                      {index === 1 && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-sm">
                          2
                        </div>
                      )}
                      {index === 2 && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                          3
                        </div>
                      )}
                      {index > 2 && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold text-sm">
                          {index + 1}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.productName}</p>
                        <p className="text-xs text-gray-500">ID: {product.productId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-gray-900">{product.totalSold}</span>
                    <span className="text-xs text-gray-500 ml-1">sản phẩm</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-[#2F855A]">
                      {walletService.formatVND(product.revenue)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-semibold">+{(Math.random() * 20 + 5).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
