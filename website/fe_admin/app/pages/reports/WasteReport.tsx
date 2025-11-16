import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import reportService from '~/service/reportService';
import type {
  WasteSummary,
  UnsoldInventory,
  WasteByCategory,
  WasteBySupplier,
  PageResponse
} from '~/service/reportService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Download, AlertTriangle, TrendingUp, TrendingDown, Package, Trash2, AlertCircle, Calendar, Store, Users, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

const RISK_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444'
};

const CATEGORY_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#6366F1', '#EF4444', '#84CC16', '#F97316'];

export default function WasteReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<'bar' | 'pie'>('bar');

  // Data
  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [categoryData, setCategoryData] = useState<WasteByCategory[]>([]);
  const [supplierData, setSupplierData] = useState<WasteBySupplier[]>([]);
  const [unsoldInventory, setUnsoldInventory] = useState<UnsoldInventory[]>([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchReportData();
  }, []);

  useEffect(() => {
    fetchUnsoldInventory();
  }, [page]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, categoryRes, supplierRes] = await Promise.all([
        reportService.getWasteSummary(),
        reportService.getWasteByCategory(),
        reportService.getWasteBySupplier()
      ]);

      setSummary(summaryRes);
      setCategoryData(categoryRes);
      setSupplierData(supplierRes);
    } catch (err: any) {
      console.error('Error fetching waste report:', err);
      setError(err.message || 'Không thể tải báo cáo lãng phí');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnsoldInventory = async () => {
    try {
      const response: PageResponse<UnsoldInventory> = await reportService.getUnsoldInventory(page, pageSize);
      setUnsoldInventory(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      console.error('Error fetching unsold inventory:', err);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await reportService.exportWasteReport();
      reportService.downloadFile(blob, `waste-report-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Không thể xuất báo cáo');
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'IMPROVING') return <TrendingDown className="w-4 h-4 text-green-600" />;
    if (trend === 'WORSENING') return <TrendingUp className="w-4 h-4 text-red-600" />;
    return null;
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
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Báo Cáo Lãng Phí Thực Phẩm</h1>
            <p className="text-gray-600">Theo dõi tồn kho chưa bán và tối ưu hóa giảm lãng phí thực phẩm</p>
          </div>
          <button
            onClick={handleExport}
            className="btn-primary flex items-center gap-2 px-4 py-2.5"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Stock */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Tổng</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{summary.totalStockQuantity.toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Tổng lượng tồn kho</p>
              <div className="mt-2 text-xs text-gray-500">
                {summary.totalProducts.toLocaleString()} sản phẩm
              </div>
            </div>

            {/* Sold Quantity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-50 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">
                  {reportService.formatPercentage(summary.sellThroughRate)}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-1">{summary.soldQuantity.toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Lượng đã bán</p>
              <div className="mt-2 text-xs text-gray-500">
                Tỷ lệ bán qua
              </div>
            </div>

            {/* Unsold Quantity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-50 p-3 rounded-xl">
                  <Trash2 className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm text-gray-500">Tồn kho</span>
              </div>
              <h3 className="text-2xl font-bold text-orange-600 mb-1">{summary.unsoldQuantity.toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Lượng chưa bán</p>
              <div className="mt-2 text-xs text-gray-500">
                Giá trị: {reportService.formatCurrency(summary.unsoldValue)}
              </div>
            </div>

            {/* Expired Quantity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-50 p-3 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-sm text-red-600 font-medium">
                  {summary.nearExpiryProducts} sắp hết hạn
                </span>
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-1">{summary.expiredQuantity.toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Lượng hết hạn</p>
              <div className="mt-2 text-xs text-gray-500">
                {summary.expiredProducts} sản phẩm
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waste by Category Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[#2F855A]" />
                Lãng phí theo Danh mục
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveChart('bar')}
                  className={`px-3 py-1 text-sm rounded-md transition-all ${
                    activeChart === 'bar' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveChart('pie')}
                  className={`px-3 py-1 text-sm rounded-md transition-all ${
                    activeChart === 'pie' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <PieChartIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {activeChart === 'bar' ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData.slice(0, 8) as any[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="categoryName" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={12}
                  />
                  <YAxis 
                    tickFormatter={(value: unknown) => `${Number(value).toFixed(0)}%`}
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === 'wasteIndex') return [`${Number(value).toFixed(2)}%`, 'Chỉ số lãng phí'];
                      if (name === 'wasteRate') return [`${Number(value).toFixed(2)}%`, 'Tỷ lệ lãng phí'];
                      if (name === 'expiryRate') return [`${Number(value).toFixed(2)}%`, 'Tỷ lệ hết hạn'];
                      return value;
                    }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="wasteRate" name="Tỷ lệ lãng phí" radius={[4, 4, 0, 0]}>
                    {categoryData.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData.slice(0, 6) as any[]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.categoryName}: ${Number(entry.wasteRate).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="wasteRate"
                    nameKey="categoryName"
                  >
                    {categoryData.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Tỷ lệ lãng phí']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Performance Metrics */}
          {summary && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#2F855A]" />
                Chỉ số Hiệu suất
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Trash2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tỷ lệ lãng phí</p>
                      <p className="text-xs text-gray-500">Giá trị lãng phí: {reportService.formatCurrency(summary.wasteValue)}</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-orange-600">
                    {reportService.formatPercentage(summary.wasteRate)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tỷ lệ hết hạn</p>
                      <p className="text-xs text-gray-500">{summary.expiredProducts} sản phẩm đã hết hạn</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-red-600">
                    {reportService.formatPercentage(summary.expiryRate)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Chỉ số lãng phí tổng thể</p>
                      <p className="text-xs text-gray-500">Xu hướng: {summary.wasteRateTrend}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-purple-600 block">
                      {summary.overallWasteIndex.toFixed(1)}
                    </span>
                    {getTrendIcon(summary.wasteRateTrend)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 gap-6">
          {/* Waste by Category Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#2F855A]" />
                Chi tiết Lãng phí theo Danh mục
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng SP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SP hết hạn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị lãng phí</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ lệ lãng phí</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chỉ số</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryData.map((category) => (
                    <tr key={category.categoryId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {category.categoryImageUrl && (
                            <img 
                              src={category.categoryImageUrl} 
                              alt={category.categoryName} 
                              className="w-8 h-8 rounded-lg mr-3 object-cover"
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900">{category.categoryName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.totalProducts.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-red-600">
                          {category.expiredProducts.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                        {reportService.formatCurrency(category.wasteValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                category.wasteRate >= 50 ? 'bg-red-500' : 
                                category.wasteRate >= 30 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(category.wasteRate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold ${
                            category.wasteRate >= 50 ? 'text-red-600' : 
                            category.wasteRate >= 30 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {reportService.formatPercentage(category.wasteRate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {category.wasteIndex.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Waste by Supplier Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2F855A]" />
                Lãng phí theo Nhà cung cấp
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhà cung cấp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng SP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SP hết hạn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ lệ bán qua</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ lệ lãng phí</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xếp hạng</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierData.map((supplier) => (
                    <tr key={supplier.supplierId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {supplier.avatarUrl && (
                            <img 
                              src={supplier.avatarUrl} 
                              alt={supplier.supplierName} 
                              className="w-8 h-8 rounded-full mr-3 object-cover"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{supplier.supplierName}</p>
                            <p className="text-xs text-gray-500">{supplier.totalStores} cửa hàng</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.totalProducts.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-red-600">
                          {supplier.expiredProducts.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                supplier.sellThroughRate >= 70 ? 'bg-green-500' : 
                                supplier.sellThroughRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(supplier.sellThroughRate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold ${
                            supplier.sellThroughRate >= 70 ? 'text-green-600' : 
                            supplier.sellThroughRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {reportService.formatPercentage(supplier.sellThroughRate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reportService.formatPercentage(supplier.wasteRate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.performanceRating === 'EXCELLENT' ? 'bg-green-100 text-green-800' :
                          supplier.performanceRating === 'GOOD' ? 'bg-blue-100 text-blue-800' :
                          supplier.performanceRating === 'FAIR' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {supplier.performanceRating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unsold Inventory Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#2F855A]" />
                  Hàng tồn kho chưa bán
                  <span className="text-sm font-normal text-gray-500">({totalElements} sản phẩm)</span>
                </h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng tồn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị tồn kho</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày hết hạn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DT tiềm năng bị mất</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unsoldInventory.map((item) => (
                    <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">{item.supplierName}</p>
                            <span className="text-xs text-gray-300">•</span>
                            <p className="text-xs text-gray-500">{item.categoryName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">{item.currentStock}</span>
                          <p className="text-xs text-gray-500">Ban đầu: {item.initialStock}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {reportService.formatCurrency(item.estimatedWasteValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.expiryDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">
                                {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                              </p>
                              <p className={`text-xs ${
                                item.daysUntilExpiry <= 2 ? 'text-red-600 font-semibold' : 
                                item.daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-gray-500'
                              }`}>
                                {item.daysUntilExpiry <= 0 ? 'Đã hết hạn' : `${item.daysUntilExpiry} ngày`}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Không rõ</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                        {reportService.formatCurrency(item.potentialRevenueLoss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} của {totalElements}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Trước
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Trang {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
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
      </div>
    </DashboardLayout>
  );
}