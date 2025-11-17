import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import reportService from '~/service/reportService';
import type {
  RevenueSummary,
  RevenueBySupplier,
  RevenueByCategory,
  RevenueTimeSeries
} from '~/service/reportService';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Store, Package, Filter } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

// Interface cho chart data
interface ChartData {
  categoryName: string;
  totalRevenue: number;
  revenuePercentage: number;
  totalOrders: number;
  totalProductsSold: number;
  averageOrderValue: number;
}

export default function RevenueReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('30');

  // Data
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [supplierData, setSupplierData] = useState<RevenueBySupplier[]>([]);
  const [categoryData, setCategoryData] = useState<RevenueByCategory[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<RevenueTimeSeries[]>([]);

  // Chart data với type safety
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Initialize date range
  useEffect(() => {
    const { startDate: start, endDate: end } = reportService.getDefaultDateRange(30);
    setStartDate(start.split('T')[0]);
    setEndDate(end.split('T')[0]);
  }, []);

  // Transform category data for charts
  useEffect(() => {
    if (categoryData.length > 0) {
      const transformedData: ChartData[] = categoryData.slice(0, 8).map(item => ({
        categoryName: item.categoryName,
        totalRevenue: item.totalRevenue,
        revenuePercentage: item.revenuePercentage,
        totalOrders: item.totalOrders,
        totalProductsSold: item.totalProductsSold,
        averageOrderValue: item.averageOrderValue
      }));
      setChartData(transformedData);
    }
  }, [categoryData]);

  // Fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate]);

  const buildDateRangePayload = () => {
    const start = new Date(`${startDate}T00:00:00`).toISOString();
    const end = new Date(`${endDate}T23:59:59`).toISOString();
    return { start, end };
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = buildDateRangePayload();

      const [summaryRes, supplierRes, categoryRes, timeSeriesRes] = await Promise.all([
        reportService.getRevenueSummary(start, end),
        reportService.getRevenueBySupplier(start, end),
        reportService.getRevenueByCategory(start, end),
        reportService.getRevenueTimeSeries(start, end)
      ]);

      setSummary(summaryRes);
      setSupplierData(supplierRes);
      setCategoryData(categoryRes);
      setTimeSeriesData(timeSeriesRes);
    } catch (err: any) {
      console.error('Error fetching revenue report:', err);
      setError(err.message || 'Không thể tải báo cáo doanh thu');
    } finally {
      setLoading(false);
    }
  };

  const handleDatePresetChange = (days: string) => {
    setDatePreset(days);
    const { startDate: start, endDate: end } = reportService.getDefaultDateRange(parseInt(days));
    setStartDate(start.split('T')[0]);
    setEndDate(end.split('T')[0]);
  };

  const handleExport = async () => {
    try {
      const { start, end } = buildDateRangePayload();
      const blob = await reportService.exportRevenueReport(start, end);
      reportService.downloadFile(blob, `revenue-report-${startDate}-to-${endDate}.csv`);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Không thể xuất báo cáo');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F855A] mb-4"></div>
            <p className="text-gray-600">Đang tải báo cáo...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchReportData}
              className="btn-primary"
            >
              Thử lại
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Báo cáo Doanh thu</h1>
            <p className="text-gray-600">Phân tích chi tiết doanh thu theo nhà cung cấp, danh mục và thời gian</p>
          </div>
          <button
            onClick={handleExport}
            className="btn-primary flex items-center gap-2 px-4 py-2.5"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Bộ lọc thời gian</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng thời gian</label>
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F855A] focus:border-transparent"
              >
                <option value="7">7 ngày qua</option>
                <option value="30">30 ngày qua</option>
                <option value="90">90 ngày qua</option>
                <option value="365">1 năm qua</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F855A] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F855A] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                className="w-full bg-[#2F855A] text-white py-2.5 px-4 rounded-xl hover:bg-[#276749] transition-colors font-medium"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <>
            {summary.totalRevenue === 0 && summary.totalOrders === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800 text-sm text-center">
                  <strong>Chú ý:</strong> Không có dữ liệu doanh thu trong khoảng thời gian này.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  {summary.revenueGrowthRate !== 0 && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      summary.revenueGrowthRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {summary.revenueGrowthRate > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {reportService.formatPercentage(Math.abs(summary.revenueGrowthRate))}
                    </div>
                  )}
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Tổng Doanh thu</h3>
                <p className="text-2xl font-bold text-gray-900">{reportService.formatCurrency(summary.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Hoa hồng: {reportService.formatCurrency(summary.totalCommission)}
                </p>
              </div>

              {/* Supplier Earnings */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-50 p-3 rounded-xl">
                    <Store className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Thu nhập NCC</h3>
                <p className="text-2xl font-bold text-green-600">{reportService.formatCurrency(summary.totalSupplierEarnings)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.totalRevenue > 0 ? ((summary.totalSupplierEarnings / summary.totalRevenue) * 100).toFixed(1) : '0.0'}% tổng doanh thu
                </p>
              </div>

              {/* Orders */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                  </div>
                  {summary.orderGrowthRate !== 0 && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      summary.orderGrowthRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {summary.orderGrowthRate > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {reportService.formatPercentage(Math.abs(summary.orderGrowthRate))}
                    </div>
                  )}
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Đơn hàng</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {reportService.formatNumber(summary.completedOrders)} / {reportService.formatNumber(summary.totalOrders)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Hoàn thành / Tổng • Hủy: {reportService.formatNumber(summary.cancelledOrders)}
                </p>
              </div>

              {/* Average Order Value */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-50 p-3 rounded-xl">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Giá trị đơn TB</h3>
                <p className="text-2xl font-bold text-gray-900">{reportService.formatCurrency(summary.averageOrderValue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Doanh thu TB/ngày: {reportService.formatCurrency(summary.averageDailyRevenue)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Revenue Time Series Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Xu hướng Doanh thu theo Thời gian</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis 
                tickFormatter={(value: number) => `${(value / 1000000).toFixed(0)}M`}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [reportService.formatCurrency(value), 'Doanh thu'];
                  if (name === 'orderCount') return [value, 'Số đơn'];
                  return [value, name];
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                name="Doanh thu" 
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Suppliers */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Top 10 Nhà cung cấp</h2>
            <div className="space-y-4">
              {supplierData.slice(0, 10).map((supplier, index) => (
                <div key={supplier.supplierId} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-semibold text-gray-700">
                    {index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {supplier.avatarUrl ? (
                      <img 
                        src={supplier.avatarUrl} 
                        alt={supplier.supplierName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{supplier.supplierName}</p>
                    <p className="text-xs text-gray-500">
                      {supplier.totalOrders} đơn • {reportService.formatPercentage(supplier.revenuePercentage)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#2F855A]">{reportService.formatCurrency(supplier.supplierEarnings)}</p>
                    <p className="text-xs text-gray-500">
                      Hoa hồng: {reportService.formatCurrency(supplier.platformCommission)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Category - Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Phân bố Doanh thu theo Danh mục</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData as any[]}
                  dataKey="totalRevenue"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ categoryName, revenuePercentage }: any) => 
                    `${categoryName}: ${reportService.formatPercentage(revenuePercentage)}`
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: unknown) => [reportService.formatCurrency(Number(value)), 'Doanh thu']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Series Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Chi tiết Doanh thu theo Thời gian</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu thuần</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hoa hồng</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số đơn</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">KH mới</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GT đơn TB</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSeriesData.slice().reverse().map((data) => {
                  const netRevenue = data.revenue - data.platformCommission;
                  return (
                    <tr key={data.date} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(data.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-[#2F855A]">
                        {reportService.formatCurrency(data.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {reportService.formatCurrency(netRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {reportService.formatCurrency(data.platformCommission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {data.orderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {data.newCustomers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {reportService.formatCurrency(data.averageOrderValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Details Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Chi tiết Doanh thu theo Danh mục</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn hàng</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SP đã bán</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Doanh thu</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">GT đơn TB</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryData.map((category) => (
                  <tr key={category.categoryId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {category.categoryImageUrl ? (
                            <img 
                              src={category.categoryImageUrl} 
                              alt={category.categoryName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{category.categoryName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {reportService.formatNumber(category.totalOrders)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {reportService.formatNumber(category.totalProductsSold)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-[#2F855A]">
                      {reportService.formatCurrency(category.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {reportService.formatPercentage(category.revenuePercentage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {reportService.formatCurrency(category.averageOrderValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}