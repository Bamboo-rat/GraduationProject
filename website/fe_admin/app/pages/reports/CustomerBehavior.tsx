import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import reportService from '~/service/reportService';
import type {
  CustomerBehaviorSummary,
  CustomerSegmentation,
  CustomerLifetimeValue
} from '~/service/reportService';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Users, TrendingUp, RefreshCw, Award, ShoppingBag, DollarSign, UserCheck } from 'lucide-react';

const TIER_COLORS = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
  DIAMOND: '#B9F2FF'
};

export default function CustomerBehavior() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('30');

  // Data
  const [summary, setSummary] = useState<CustomerBehaviorSummary | null>(null);
  const [segmentation, setSegmentation] = useState<CustomerSegmentation[]>([]);
  const [clvData, setClvData] = useState<CustomerLifetimeValue[]>([]);
  const [clvPage, setClvPage] = useState(0);
  const [clvTotalPages, setClvTotalPages] = useState(0);

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

  // Fetch CLV data when page changes
  useEffect(() => {
    if (startDate && endDate) {
      fetchCLVData();
    }
  }, [clvPage]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const start = new Date(startDate).toISOString();
      const end = new Date(endDate + 'T23:59:59').toISOString();

      const [summaryRes, segmentationRes] = await Promise.all([
        reportService.getCustomerBehaviorSummary(start, end),
        reportService.getCustomerSegmentation(start, end)
      ]);

      setSummary(summaryRes);
      setSegmentation(segmentationRes);

      await fetchCLVData();
    } catch (err: any) {
      console.error('Error fetching customer behavior report:', err);
      setError(err.message || 'Không thể tải báo cáo hành vi khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchCLVData = async () => {
    try {
      const clvRes = await reportService.getCustomerLifetimeValue(clvPage, 20);
      setClvData(clvRes.content);
      setClvTotalPages(clvRes.totalPages);
    } catch (err: any) {
      console.error('Error fetching CLV data:', err);
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
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate + 'T23:59:59').toISOString();
      const blob = await reportService.exportCustomerBehaviorReport(start, end);
      reportService.downloadFile(blob, `customer-behavior-${startDate}-to-${endDate}.csv`);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Không thể xuất báo cáo');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Lỗi: {error}</p>
            <button onClick={fetchReportData} className="mt-2 text-sm underline">Thử lại</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Phân tích Hành vi Khách hàng</h1>
          <p className="text-gray-600">Phân khúc khách hàng, giá trị vòng đời và mô hình mua hàng</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng thời gian</label>
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">7 ngày qua</option>
                <option value="30">30 ngày qua</option>
                <option value="90">90 ngày qua</option>
                <option value="365">1 năm qua</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Xuất CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-sm text-gray-600 mb-1">Tổng Khách hàng</h3>
              <p className="text-2xl font-bold text-gray-800">{reportService.formatNumber(summary.totalCustomers)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Hoạt động: {reportService.formatNumber(summary.activeCustomers)} ({reportService.formatPercentage(summary.activeCustomerRate)})
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-sm text-gray-600 mb-1">KH Quay lại</h3>
              <p className="text-2xl font-bold text-green-600">{reportService.formatPercentage(summary.repeatPurchaseRate)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Mới: {reportService.formatNumber(summary.newCustomers)} | Cũ: {reportService.formatNumber(summary.returningCustomers)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="bg-purple-100 p-3 rounded-lg mb-4">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-sm text-gray-600 mb-1">CLV Trung bình</h3>
              <p className="text-2xl font-bold text-gray-800">{reportService.formatCurrency(summary.averageCustomerLifetimeValue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                GT đơn TB: {reportService.formatCurrency(summary.averageOrderValue)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="bg-yellow-100 p-3 rounded-lg mb-4">
                <ShoppingBag className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-sm text-gray-600 mb-1">Đơn TB/KH</h3>
              <p className="text-2xl font-bold text-gray-800">{summary.averageOrdersPerCustomer.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Tỷ lệ giữ chân: {reportService.formatPercentage(summary.customerRetentionRate)}
              </p>
            </div>
          </div>
        )}

        {/* Customer Segmentation Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Segmentation by Tier - Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Phân khúc theo Hạng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentation}
                  dataKey="customerCount"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.tier}: ${reportService.formatPercentage(entry.customerPercentage)}`}
                >
                  {segmentation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier as keyof typeof TIER_COLORS] || '#999'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Tier - Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Doanh thu theo Hạng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value: any) => reportService.formatCurrency(value)} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#3B82F6" name="Doanh thu" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segmentation Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Chi tiết Phân khúc Khách hàng</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số KH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% KH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Doanh thu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GT đơn TB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn TB/KH</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {segmentation.map((segment) => (
                  <tr key={segment.tier} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: TIER_COLORS[segment.tier as keyof typeof TIER_COLORS] || '#999' }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">{segment.tier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reportService.formatNumber(segment.customerCount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{reportService.formatPercentage(segment.customerPercentage)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reportService.formatNumber(segment.totalOrders)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{reportService.formatCurrency(segment.totalRevenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{reportService.formatPercentage(segment.revenuePercentage)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reportService.formatCurrency(segment.averageOrderValue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{segment.averageOrdersPerCustomer.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Lifetime Value Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Top Khách hàng theo Giá trị Vòng đời (CLV)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng chi tiêu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GT đơn TB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CLV dự đoán</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phân khúc</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clvData.map((customer) => (
                  <tr key={customer.customerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded" style={{
                        backgroundColor: TIER_COLORS[customer.tier as keyof typeof TIER_COLORS] || '#999',
                        color: 'white'
                      }}>
                        {customer.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {reportService.formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.completedOrders}/{customer.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportService.formatCurrency(customer.averageOrderValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {reportService.formatCurrency(customer.predictedLifetimeValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        customer.customerSegment === 'High Value' ? 'bg-green-100 text-green-800' :
                        customer.customerSegment === 'Medium Value' ? 'bg-blue-100 text-blue-800' :
                        customer.customerSegment === 'At Risk' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.customerSegment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {clvTotalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={() => setClvPage(Math.max(0, clvPage - 1))}
                disabled={clvPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="text-sm text-gray-700">
                Trang {clvPage + 1} / {clvTotalPages}
              </span>
              <button
                onClick={() => setClvPage(Math.min(clvTotalPages - 1, clvPage + 1))}
                disabled={clvPage >= clvTotalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
