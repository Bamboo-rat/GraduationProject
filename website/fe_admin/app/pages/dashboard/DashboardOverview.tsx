import { useEffect, useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import type {
  DashboardOverview as DashboardOverviewType,
  SalesTrend,
  TopProduct,
  CategoryRevenue,
  TopStore
} from '~/service/dashboardService';
import Toast from '~/component/common/Toast';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  Package,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function DashboardOverview() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get data from React Router 7 loader (loaded BEFORE navigation)
  const loaderData = useLoaderData() as {
    overview: DashboardOverviewType | null;
    salesTrends: SalesTrend[];
    topProducts: TopProduct[];
    categoryRevenue: CategoryRevenue[];
    topStores: TopStore[];
    dateRange: string;
    customStartDate: string;
    customEndDate: string;
    error?: string;
  };

  // Initialize state from loader data
  const [overview, setOverview] = useState<DashboardOverviewType | null>(loaderData.overview);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>(loaderData.salesTrends);
  const [topProducts, setTopProducts] = useState<TopProduct[]>(loaderData.topProducts);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>(loaderData.categoryRevenue);
  const [topStores, setTopStores] = useState<TopStore[]>(loaderData.topStores);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    loaderData.error ? { message: loaderData.error, type: 'error' } : null
  );

  // Date range filter state
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'custom'>(
    loaderData.dateRange as any || '30days'
  );
  const [customStartDate, setCustomStartDate] = useState(loaderData.customStartDate);
  const [customEndDate, setCustomEndDate] = useState(loaderData.customEndDate);

  // Update state when loader data changes (on navigation)
  useEffect(() => {
    setOverview(loaderData.overview);
    setSalesTrends(loaderData.salesTrends);
    setTopProducts(loaderData.topProducts);
    setCategoryRevenue(loaderData.categoryRevenue);
    setTopStores(loaderData.topStores);
    if (loaderData.error) {
      setToast({ message: loaderData.error, type: 'error' });
    }
  }, [loaderData]);

  // Update URL when filters change
  useEffect(() => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      const params = new URLSearchParams();
      params.set('range', 'custom');
      params.set('start', customStartDate);
      params.set('end', customEndDate);
      setSearchParams(params);
    } else if (dateRange !== 'custom') {
      const params = new URLSearchParams();
      params.set('range', dateRange);
      setSearchParams(params);
    }
  }, [dateRange, customStartDate, customEndDate]);

  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    switch (dateRange) {
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '90days':
        start.setDate(end.getDate() - 90);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            startDate: customStartDate,
            endDate: customEndDate
          };
        }
        start.setDate(end.getDate() - 30);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
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

  // Prepare growth trend data
  const getGrowthTrendData = () => {
    if (salesTrends.length < 2) return [];

    return salesTrends.map((trend, index) => {
      if (index === 0) {
        return {
          date: new Date(trend.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
          orderGrowth: 0,
          customerGrowth: 0
        };
      }

      const prevRevenue = salesTrends[index - 1].revenue;
      const prevOrders = salesTrends[index - 1].orderCount;

      const orderGrowth = prevOrders > 0 ? ((trend.orderCount - prevOrders) / prevOrders) * 100 : 0;

      return {
        date: new Date(trend.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        orderGrowth: Number(orderGrowth.toFixed(2)),
        customerGrowth: overview ? overview.customerGrowthRate : 0
      };
    });
  };

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-primary mb-2">Tổng quan hệ thống</h1>
          <p className="text-muted">Thống kê và phân tích hiệu suất kinh doanh</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Orders */}
          <div className="card card-hover p-6 bg-gradient-to-br from-[#2F855A] to-[#8FB491] text-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Tổng đơn hàng</h3>
              <ShoppingCart className="w-8 h-8 opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{overview.totalOrders.toLocaleString()}</p>
            {formatGrowthRate(overview.orderGrowthRate)}
          </div>

          {/* Total Customers */}
          <div className="card card-hover p-6 bg-gradient-to-br from-[#A4C3A2] to-[#B7E4C7] text-text">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Tổng khách hàng</h3>
              <Users className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-2">{overview.totalCustomers.toLocaleString()}</p>
            {formatGrowthRate(overview.customerGrowthRate)}
          </div>

          {/* Total Suppliers */}
          <div className="card card-hover p-6 bg-gradient-to-br from-[#DDC6B6] to-[#F5EDE6] text-text">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Tổng nhà cung cấp</h3>
              <Store className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-2">{overview.totalSuppliers.toLocaleString()}</p>
            <div className="text-sm text-muted">
              Cửa hàng: {overview.totalStores}
            </div>
          </div>

          {/* Total Products */}
          <div className="card card-hover p-6 bg-gradient-to-br from-[#FFE8E8] to-[#FFD1D1] text-text border border-[#FF6B35]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Tổng sản phẩm</h3>
              <Package className="w-8 h-8 text-[#E63946]" />
            </div>
            <p className="text-3xl font-bold mb-2">{overview.totalProducts.toLocaleString()}</p>
            <div className="text-sm text-muted">
              Đang bán: {overview.activeProducts}
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="card p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <Calendar className="w-5 h-5 text-[#2F855A]" />
            <span className="text-sm font-medium">Khoảng thời gian:</span>
            
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange('7days')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === '7days'
                    ? 'bg-[#2F855A] text-surface'
                    : 'bg-surface-light text-text hover:bg-surface'
                }`}
              >
                7 ngày
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === '30days'
                    ? 'bg-[#2F855A] text-surface'
                    : 'bg-surface-light text-text hover:bg-surface'
                }`}
              >
                30 ngày
              </button>
              <button
                onClick={() => setDateRange('90days')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === '90days'
                    ? 'bg-[#2F855A] text-surface'
                    : 'bg-surface-light text-text hover:bg-surface'
                }`}
              >
                90 ngày
              </button>
              <button
                onClick={() => setDateRange('custom')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === 'custom'
                    ? 'bg-[#2F855A] text-surface'
                    : 'bg-surface-light text-text hover:bg-surface'
                }`}
              >
                Tùy chỉnh
              </button>
            </div>

            {dateRange === 'custom' && (
              <div className="flex gap-3 items-center">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-default rounded-lg text-sm"
                />
                <span>đến</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-default rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="card p-6 mb-8">
          <h2 className="heading-secondary mb-6">Biểu đồ tổng doanh thu</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={salesTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#B7E4C7" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                stroke="#2F855A"
              />
              <YAxis 
                tickFormatter={(value) => formatShortCurrency(value)}
                stroke="#2F855A"
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(date) => new Date(date).toLocaleDateString('vi-VN')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Doanh thu" 
                stroke="#2F855A" 
                strokeWidth={3}
                dot={{ fill: '#2F855A', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Rate Trends Chart */}
        <div className="card p-6 mb-8">
          <h2 className="heading-secondary mb-6">Xu hướng tăng trưởng</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={getGrowthTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#B7E4C7" />
              <XAxis dataKey="date" stroke="#2F855A" />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
                stroke="#2F855A"
              />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="orderGrowth" 
                name="Tỷ lệ tăng trưởng đơn hàng" 
                stroke="#2F855A" 
                strokeWidth={2}
                dot={{ fill: '#2F855A', r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="customerGrowth" 
                name="Tỷ lệ tăng trưởng khách hàng" 
                stroke="#A4C3A2" 
                strokeWidth={2}
                dot={{ fill: '#A4C3A2', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-surface-light rounded-lg">
            <p className="text-sm text-muted">
              <strong>Tỷ lệ tăng trưởng đơn hàng so với tháng trước:</strong> {formatGrowthRate(overview.orderGrowthRate)}
            </p>
            <p className="text-sm text-muted mt-2">
              <strong>Tỷ lệ tăng trưởng khách hàng so với tháng trước:</strong> {formatGrowthRate(overview.customerGrowthRate)}
            </p>
          </div>
        </div>

        {/* Top Categories and Top Stores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Categories */}
          <div className="card p-6">
            <h2 className="heading-secondary mb-6">Top danh mục bán chạy</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryRevenue.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#B7E4C7" />
                <XAxis type="number" tickFormatter={(value) => formatShortCurrency(value)} />
                <YAxis dataKey="categoryName" type="category" width={100} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#2F855A" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Stores */}
          <div className="card p-6">
            <h2 className="heading-secondary mb-6">Top cửa hàng bán chạy</h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topStores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#B7E4C7" />
                <XAxis type="number" tickFormatter={(value) => formatShortCurrency(value)} />
                <YAxis dataKey="storeName" type="category" width={120} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" name="Doanh thu" fill="#A4C3A2" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products List */}
        <div className="card p-6">
          <h2 className="heading-secondary mb-6">Top 5 sản phẩm bán chạy</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center space-x-4 p-4 bg-surface-light rounded-lg border border-default transition-all hover:border-[#A4C3A2] group"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-[#FF6B35] text-surface' :
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
