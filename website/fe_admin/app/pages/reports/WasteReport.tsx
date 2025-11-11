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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download, AlertTriangle, TrendingUp, TrendingDown, Package, Trash2, AlertCircle, Calendar } from 'lucide-react';

const RISK_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444'
};

const CATEGORY_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#6366F1', '#EF4444'];

export default function WasteReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Báo cáo Lãng phí</h1>
            <p className="text-gray-600">Theo dõi tồn kho chưa bán và tối ưu hóa giảm lãng phí thực phẩm</p>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  {getTrendIcon(summary.wasteRateTrend)}
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Tỷ lệ Bán qua</h3>
                <p className="text-2xl font-bold text-gray-800">{reportService.formatPercentage(summary.sellThroughRate)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.soldQuantity.toLocaleString()} / {summary.totalStockQuantity.toLocaleString()} sản phẩm
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Trash2 className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Tỷ lệ Lãng phí</h3>
                <p className="text-2xl font-bold text-gray-800">{reportService.formatPercentage(summary.wasteRate)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.unsoldQuantity.toLocaleString()} sản phẩm chưa bán
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Tỷ lệ Hết hạn</h3>
                <p className="text-2xl font-bold text-gray-800">{reportService.formatPercentage(summary.expiryRate)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.expiredProducts} sản phẩm | {summary.nearExpiryProducts} sắp hết hạn
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">Chỉ số Lãng phí</h3>
                <p className="text-2xl font-bold text-gray-800">{summary.overallWasteIndex.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Giá trị lãng phí: {reportService.formatCurrency(summary.wasteValue)}
                </p>
              </div>
            </div>

            {/* Top Waste Contributors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Danh mục Lãng phí</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{summary.topWasteCategoryName}</p>
                      <p className="text-xs text-gray-600">Giá trị lãng phí cao nhất</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-700">{reportService.formatCurrency(summary.topWasteCategoryValue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Nhà cung cấp Lãng phí</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{summary.topWasteSupplierName}</p>
                      <p className="text-xs text-gray-600">Cần cải thiện quản lý tồn kho</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-700">{reportService.formatCurrency(summary.topWasteSupplierValue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Waste by Category Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Lãng phí theo Danh mục</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData.slice(0, 8) as any[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoryName" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value: unknown) => `${Number(value).toFixed(0)}%`} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'wasteIndex') return [`${value.toFixed(2)}%`, 'Chỉ số lãng phí'];
                  if (name === 'wasteRate') return [`${value.toFixed(2)}%`, 'Tỷ lệ lãng phí'];
                  if (name === 'expiryRate') return [`${value.toFixed(2)}%`, 'Tỷ lệ hết hạn'];
                  return value;
                }}
              />
              <Legend />
              <Bar dataKey="wasteIndex" fill="#8B5CF6" name="Chỉ số lãng phí">
                {categoryData.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Waste by Supplier */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Nhà cung cấp - Hiệu suất Tồn kho</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ bán</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tỷ lệ lãng phí</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị lãng phí</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplierData.slice(0, 10).map((supplier, index) => (
                  <tr key={supplier.supplierId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={supplier.avatarUrl || 'https://via.placeholder.com/40'} alt={supplier.supplierName} className="w-10 h-10 rounded-full" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{supplier.supplierName}</p>
                          <p className="text-xs text-gray-500">{supplier.totalStores} cửa hàng</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.totalProducts} ({supplier.activeProducts} hoạt động)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${supplier.sellThroughRate >= 70 ? 'text-green-600' : supplier.sellThroughRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {reportService.formatPercentage(supplier.sellThroughRate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{reportService.formatPercentage(supplier.wasteRate)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {reportService.formatCurrency(supplier.wasteValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Tồn kho Chưa bán ({totalElements} sản phẩm)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cửa hàng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn sử dụng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rủi ro</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unsoldInventory.map((item) => (
                  <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.variantName} • {item.categoryName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.supplierName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.storeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">{item.currentStock}</span>
                        <span className="text-gray-500"> / {item.initialStock}</span>
                      </div>
                      <p className="text-xs text-gray-500">Đã bán: {item.soldQuantity}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.expiryDate ? (
                        <div className="text-sm">
                          <p className="text-gray-900">{new Date(item.expiryDate).toLocaleDateString('vi-VN')}</p>
                          {item.daysUntilExpiry !== null && (
                            <p className={`text-xs flex items-center gap-1 ${item.daysUntilExpiry <= 2 ? 'text-red-600' : item.daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                              <Calendar className="w-3 h-3" />
                              {item.daysUntilExpiry <= 0 ? 'Đã hết hạn' : `Còn ${item.daysUntilExpiry} ngày`}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Không rõ</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="text-gray-900">{reportService.formatCurrency(item.estimatedWasteValue)}</p>
                        <p className="text-xs text-red-600">Lỗ: {reportService.formatCurrency(item.potentialRevenueLoss)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(item.wasteRiskLevel)}`}>
                        {item.wasteRiskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} trong tổng số {totalElements} sản phẩm
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
