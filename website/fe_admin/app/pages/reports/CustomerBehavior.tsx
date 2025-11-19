import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import reportService from '~/service/reportService';
import type {
  CustomerBehaviorSummary,
  CustomerSegmentation,
  CustomerLifetimeValue
} from '~/service/reportService';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Users, UserCheck, UserPlus, Ban, ShieldAlert, TrendingDown, Award, ShoppingBag, DollarSign, Calendar, Filter } from 'lucide-react';

const TIER_COLORS = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
  DIAMOND: '#B9F2FF'
};

const SEGMENT_COLORS = {
  'High Value': '#10B981',
  'Medium Value': '#3B82F6',
  'Low Value': '#6B7280',
  'At Risk': '#EF4444',
  'New': '#8B5CF6'
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
      const { start, end } = buildDateRangePayload();
      const clvRes = await reportService.getCustomerLifetimeValue(clvPage, 20, 'totalSpent', 'DESC', start, end);
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
      const { start, end } = buildDateRangePayload();
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
              <ShieldAlert className="w-6 h-6 text-red-600" />
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Phân tích Hành vi Khách hàng</h1>
            <p className="text-gray-600">Phân khúc khách hàng, giá trị vòng đời và mô hình mua hàng</p>
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
            {summary.totalCustomers === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800 text-sm text-center">
                  <strong>Chú ý:</strong> Không có dữ liệu khách hàng trong hệ thống.
                </p>
              </div>
            )}
            
            {/* Main Customer Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Tổng Khách hàng</h3>
                <p className="text-2xl font-bold text-gray-900">{reportService.formatNumber(summary.totalCustomers)}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-50 p-3 rounded-xl">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    {reportService.formatPercentage(summary.activeCustomerRate)}
                  </span>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Khách hàng hoạt động</h3>
                <p className="text-2xl font-bold text-green-600">{reportService.formatNumber(summary.activeCustomers)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Tỷ lệ hoạt động
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-50 p-3 rounded-xl">
                    <UserPlus className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Khách hàng mới</h3>
                <p className="text-2xl font-bold text-purple-600">{reportService.formatNumber(summary.newCustomers)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Khách hàng quay lại: {reportService.formatNumber(summary.returningCustomers)}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-50 p-3 rounded-xl">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Tỷ lệ trả hàng</h3>
                <p className="text-2xl font-bold text-red-600">{reportService.formatPercentage(summary.returnRate)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Đơn hàng bị trả lại
                </p>
              </div>
            </div>

            {/* Second Row Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Khách hàng bị tạm khóa</h3>
                    <p className="text-2xl font-bold text-orange-600">{reportService.formatNumber(summary.suspendedCustomers)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {summary.totalCustomers > 0 ? reportService.formatPercentage((summary.suspendedCustomers / summary.totalCustomers) * 100) : '0%'} tổng khách hàng
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-50 p-2 rounded-lg">
                    <Ban className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Khách hàng bị cấm</h3>
                    <p className="text-2xl font-bold text-red-600">{reportService.formatNumber(summary.bannedCustomers)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {summary.totalCustomers > 0 ? reportService.formatPercentage((summary.bannedCustomers / summary.totalCustomers) * 100) : '0%'} tổng khách hàng
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-50 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Giá trị vòng đời trung bình</h3>
                    <p className="text-2xl font-bold text-gray-900">{reportService.formatCurrency(summary.averageCustomerLifetimeValue)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Giá trị đơn trung bình: {reportService.formatCurrency(summary.averageOrderValue)}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-50 p-2 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Đơn hàng trung bình/Khách hàng</h3>
                    <p className="text-2xl font-bold text-gray-900">{summary.averageOrdersPerCustomer.toFixed(1)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Tỷ lệ giữ chân khách hàng: {reportService.formatPercentage(summary.customerRetentionRate)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Tier Distribution */}
        {summary && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2F855A]" />
              Phân phối hạng thành viên
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { tier: 'Bronze', count: summary.bronzeTierCount, color: '#CD7F32' },
                { tier: 'Silver', count: summary.silverTierCount, color: '#C0C0C0' },
                { tier: 'Gold', count: summary.goldTierCount, color: '#FFD700' },
                { tier: 'Platinum', count: summary.platinumTierCount, color: '#E5E4E2' },
                { tier: 'Diamond', count: summary.diamondTierCount, color: '#B9F2FF' }
              ].map(({ tier, count, color }) => (
                <div key={tier} className="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                    <Award className={`w-6 h-6 ${tier === 'Platinum' || tier === 'Diamond' ? 'text-gray-700' : 'text-white'}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{tier}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{reportService.formatNumber(count)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.totalCustomers > 0 ? reportService.formatPercentage((count / summary.totalCustomers) * 100) : '0.00%'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Segmentation Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Segmentation by Tier - Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Phân phối theo Hạng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentation as any[]}
                  dataKey="customerCount"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ tier, customerPercentage }: any) => `${tier}: ${reportService.formatPercentage(Number(customerPercentage))}`}
                >
                  {segmentation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier as keyof typeof TIER_COLORS] || '#999'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: unknown) => [reportService.formatNumber(Number(value)), '']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Tier - Bar Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Doanh thu theo Hạng</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentation as any[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="tier" 
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value: unknown) => `${(Number(value) / 1000000).toFixed(0)}M`}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: unknown) => [reportService.formatCurrency(Number(value)), 'Doanh thu']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="totalRevenue" 
                  fill="#2F855A" 
                  name="Doanh thu" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segmentation Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Chi tiết Phân khúc Khách hàng</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phần trăm khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng đơn hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị đơn trung bình</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {segmentation.map((segment) => (
                  <tr key={segment.tier} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: TIER_COLORS[segment.tier as keyof typeof TIER_COLORS] || '#999' }}
                        />
                        <span className="text-sm font-medium text-gray-900">{segment.tier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportService.formatNumber(segment.customerCount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {reportService.formatPercentage(segment.customerPercentage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportService.formatNumber(segment.totalOrders)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2F855A]">
                      {reportService.formatCurrency(segment.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportService.formatCurrency(segment.averageOrderValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Lifetime Value Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Top khách hàng theo giá trị vòng đời</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạng thành viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng chi tiêu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị vòng đời dự đoán</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phân khúc khách hàng</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clvData.map((customer) => (
                  <tr key={customer.customerId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{
                          backgroundColor: TIER_COLORS[customer.tier as keyof typeof TIER_COLORS] || '#999'
                        }}
                      >
                        {customer.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2F855A]">
                      {reportService.formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <span>{customer.completedOrders}</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-500">{customer.totalOrders}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2F855A]">
                      {reportService.formatCurrency(customer.predictedLifetimeValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="px-2 py-1 text-xs font-semibold rounded-full"
                        style={{
                          backgroundColor: `${SEGMENT_COLORS[customer.customerSegment as keyof typeof SEGMENT_COLORS] || '#6B7280'}20`,
                          color: SEGMENT_COLORS[customer.customerSegment as keyof typeof SEGMENT_COLORS] || '#6B7280'
                        }}
                      >
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
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Trang {clvPage + 1} / {clvTotalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClvPage(Math.max(0, clvPage - 1))}
                    disabled={clvPage === 0}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setClvPage(Math.min(clvTotalPages - 1, clvPage + 1))}
                    disabled={clvPage >= clvTotalPages - 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}