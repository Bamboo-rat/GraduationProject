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
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Store, Package } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

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

  // Initialize date range
  useEffect(() => {
    const { startDate: start, endDate: end } = reportService.getDefaultDateRange(30);
    setStartDate(start.split('T')[0]);
    setEndDate(end.split('T')[0]);
  }, []);

  // Fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate]);

   const buildDateRangePayload = () => {
    // Create proper ISO DateTime with timezone
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
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F855A]"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="card p-6 bg-red-50 border border-red-200">
            <p className="font-medium text-red-800 mb-2">⚠️ Lỗi: {error}</p>
            <p className="text-sm text-red-600 mb-4">Kiểm tra: Backend có đang chạy? Mạng có kết nối?</p>
            <button onClick={fetchReportData} className="btn-primary">Thử lại</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="heading-primary mb-2">Báo cáo doanh thu</h1>
            <p className="text-muted">Phân tích chi tiết doanh thu theo nhà cung cấp, danh mục và thời gian</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-end">
            {/* Date Preset */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-text mb-2">Khoảng thời gian</label>
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:ring-2 focus:ring-[#2F855A] focus:border-transparent"
              >
              <option value="7">7 ngày qua</option>
              <option value="30">30 ngày qua</option>
              <option value="90">90 ngày qua</option>
              <option value="365">1 năm qua</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Xuất CSV
            </button>
        </div>
      </div>

        {/* Summary Cards */}
        {summary && (
          <>
            {summary.totalRevenue === 0 && summary.totalOrders === 0 && (
              <div className="card p-6 mb-6 bg-yellow-50 border border-yellow-200">
                <p className="text-yellow-800 text-sm">
                  <strong>Chú ý:</strong> Không có dữ liệu doanh thu trong khoảng thời gian này. 
                  Chỉ có các đơn hàng đã GIAO THÀNH CÔNG (DELIVERED) và có ngày giao hàng (deliveredAt) mới được tính vào báo cáo.
                </p>
              </div>
            )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card card-hover p-6 bg-gradient-to-br from-[#2F855A] to-[#8FB491] text-surface">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-white/20">
                  <DollarSign className="w-6 h-6" />
                </div>
                {summary.revenueGrowthRate !== 0 && (
                  <div className={`flex items-center gap-1 text-sm font-medium`}>
                    {summary.revenueGrowthRate > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {reportService.formatPercentage(Math.abs(summary.revenueGrowthRate))}
                  </div>
                )}
              </div>
              <h3 className="text-sm opacity-90 mb-1">Tổng Doanh thu</h3>
              <p className="text-2xl font-bold">{reportService.formatCurrency(summary.totalRevenue)}</p>
              <p className="text-xs opacity-80 mt-1">
                Hoa hồng: {reportService.formatCurrency(summary.totalCommission)}
              </p>
            </div>

            <div className="card card-hover p-6 bg-gradient-to-br from-[#A4C3A2] to-[#B7E4C7] text-text">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-[#2F855A]/10">
                  <Store className="w-6 h-6 text-[#2F855A]" />
                </div>
              </div>
              <h3 className="text-sm text-muted mb-1">Thu nhà cung cấp</h3>
              <p className="text-2xl font-bold">{reportService.formatCurrency(summary.totalSupplierEarnings)}</p>
              <p className="text-xs text-muted mt-1">
                ~{summary.totalRevenue > 0 ? ((summary.totalSupplierEarnings / summary.totalRevenue) * 100).toFixed(1) : '0.0'}% tổng doanh thu
              </p>
            </div>

            <div className="card card-hover p-6 bg-gradient-to-br from-[#DDC6B6] to-[#F5EDE6] text-text">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-[#2F855A]/10">
                  <ShoppingCart className="w-6 h-6 text-[#2F855A]" />
                </div>
                {summary.orderGrowthRate !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${summary.orderGrowthRate > 0 ? 'text-[#2F855A]' : 'text-[#E63946]'}`}>
                    {summary.orderGrowthRate > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {reportService.formatPercentage(Math.abs(summary.orderGrowthRate))}
                  </div>
                )}
              </div>
              <h3 className="text-sm text-muted mb-1">Đơn hàng</h3>
              <p className="text-2xl font-bold">{reportService.formatNumber(summary.completedOrders)} / {reportService.formatNumber(summary.totalOrders)}</p>
              <p className="text-xs text-muted mt-1">
                Hoàn thành / Tổng • Hủy: {reportService.formatNumber(summary.cancelledOrders)}
              </p>
            </div>

            <div className="card card-hover p-6 bg-gradient-to-br from-[#FFE8E8] to-[#FFD1D1] text-text border border-[#FF6B35]">
              <div className="p-3 rounded-lg bg-[#E63946]/10 mb-4">
                <Package className="w-6 h-6 text-[#E63946]" />
              </div>
              <h3 className="text-sm text-muted mb-1">Giá trị đơn TB</h3>
              <p className="text-2xl font-bold">{reportService.formatCurrency(summary.averageOrderValue)}</p>
              <p className="text-xs text-muted mt-1">
                Doanh thu TB/ngày: {reportService.formatCurrency(summary.averageDailyRevenue)}
              </p>
            </div>
          </div>
          </>
        )}

      {/* Revenue Time Series Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Xu hướng Doanh thu</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData as any[]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value: unknown) => `${(Number(value) / 1000000).toFixed(0)}M`} />
            <Tooltip formatter={(value: any) => reportService.formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Doanh thu" />
            <Line type="monotone" dataKey="orderCount" stroke="#10B981" strokeWidth={2} name="Số đơn" yAxisId={1} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Time Series Data Table */}
      <div className="card mb-8">
        <div className="px-6 py-4 border-b border-default">
          <h2 className="heading-secondary">Chuỗi thời gian doanh thu chi tiết</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#B7E4C7]">
            <thead className="bg-surface-light">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text uppercase">Ngày</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text uppercase">Tổng doanh thu</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text uppercase">Doanh thu thuần</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text uppercase">Hoa hồng nền tảng</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text uppercase">Số đơn hàng</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text uppercase">Khách hàng mới</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text uppercase">Giá trị TB</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-[#B7E4C7]">
              {timeSeriesData.slice().reverse().map((data) => {
                const netRevenue = data.revenue - data.platformCommission;
                return (
                  <tr key={data.date} className="hover:bg-surface-light transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                      {new Date(data.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-[#2F855A]">
                      {reportService.formatCurrency(data.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-text">
                      {reportService.formatCurrency(netRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-text">
                      {reportService.formatCurrency(data.platformCommission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-text">
                      {data.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-text">
                      {data.newCustomers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-text">
                      {reportService.formatCurrency(data.averageOrderValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-surface-light border-t-2 border-[#2F855A]">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-text">Tổng cộng</td>
                <td className="px-6 py-4 text-sm text-right font-bold text-[#2F855A]">
                  {reportService.formatCurrency(
                    timeSeriesData.reduce((sum, d) => sum + d.revenue, 0)
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-text">
                  {reportService.formatCurrency(
                    timeSeriesData.reduce((sum, d) => sum + (d.revenue - d.platformCommission), 0)
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-text">
                  {reportService.formatCurrency(
                    timeSeriesData.reduce((sum, d) => sum + d.platformCommission, 0)
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-text">
                  {timeSeriesData.reduce((sum, d) => sum + d.orderCount, 0)}
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-text">
                  {timeSeriesData.reduce((sum, d) => sum + d.newCustomers, 0)}
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-text">
                  {reportService.formatCurrency(
                    timeSeriesData.reduce((sum, d) => sum + d.averageOrderValue, 0) / timeSeriesData.length
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Revenue by Supplier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Nhà cung cấp</h2>
          <div className="space-y-3">
            {supplierData.slice(0, 10).map((supplier, index) => (
              <div key={supplier.supplierId} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-semibold">
                  {index + 1}
                </span>
                <img src={supplier.avatarUrl || 'https://via.placeholder.com/40'} alt={supplier.supplierName} className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{supplier.supplierName}</p>
                  <p className="text-xs text-gray-500">
                    {supplier.totalOrders} đơn • {reportService.formatPercentage(supplier.revenuePercentage)} • 
                    Hoa hồng {reportService.formatPercentage((supplier.commissionRate || 0) * 100)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#2F855A]">{reportService.formatCurrency(supplier.supplierEarnings)}</p>
                  <p className="text-xs text-gray-500">
                    Nền tảng: {reportService.formatCurrency(supplier.platformCommission)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Doanh thu theo Danh mục</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData.slice(0, 8) as any[]}
                dataKey="totalRevenue"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: any) => `${entry.categoryName}: ${reportService.formatPercentage(entry.revenuePercentage)}`}
              >
                {categoryData.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => reportService.formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Chi tiết Doanh thu theo Danh mục</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SP đã bán</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Doanh thu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GT đơn TB</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.map((category) => (
                <tr key={category.categoryId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img src={category.categoryImageUrl || 'https://via.placeholder.com/40'} alt={category.categoryName} className="w-10 h-10 rounded" />
                      <span className="ml-3 text-sm font-medium text-gray-900">{category.categoryName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reportService.formatNumber(category.totalOrders)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reportService.formatNumber(category.totalProductsSold)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{reportService.formatCurrency(category.totalRevenue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{reportService.formatPercentage(category.revenuePercentage)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reportService.formatCurrency(category.averageOrderValue)}</td>
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
