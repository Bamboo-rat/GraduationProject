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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Lỗi: {error}</p>
          <button onClick={fetchReportData} className="mt-2 text-sm underline">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-primary">Báo Cáo Lãng Phí Thực Phẩm</h1>
            <p className="text-muted">Theo dõi tồn kho chưa bán và tối ưu hóa giảm lãng phí thực phẩm</p>
          </div>
          <button
            onClick={handleExport}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <>
            {/* First Row: Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="card card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-muted mb-1">Tổng lượng tồn kho</h3>
                <p className="text-3xl font-bold text-gray-800">{summary.totalStockQuantity.toLocaleString()}</p>
                <p className="text-xs text-muted mt-1">
                  {summary.totalProducts.toLocaleString()} sản phẩm
                </p>
              </div>

              <div className="card card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-muted mb-1">Lượng đã bán</h3>
                <p className="text-3xl font-bold text-[#2F855A]">{summary.soldQuantity.toLocaleString()}</p>
                <p className="text-xs text-muted mt-1">
                  {reportService.formatPercentage(summary.sellThroughRate)} tỷ lệ bán qua
                </p>
              </div>

              <div className="card card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-lg">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-muted mb-1">Lượng chưa bán</h3>
                <p className="text-3xl font-bold text-orange-600">{summary.unsoldQuantity.toLocaleString()}</p>
                <p className="text-xs text-muted mt-1">
                  Giá trị: {reportService.formatCurrency(summary.unsoldValue)}
                </p>
              </div>

              <div className="card card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-muted mb-1">Lượng hết hạn</h3>
                <p className="text-3xl font-bold text-red-600">{summary.expiredQuantity.toLocaleString()}</p>
                <p className="text-xs text-muted mt-1">
                  {summary.expiredProducts} sản phẩm | {summary.nearExpiryProducts} sắp hết hạn
                </p>
              </div>
            </div>

            {/* Second Row: Rates & Index */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="card card-hover">
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-3 rounded-lg mb-4 inline-block">
                  <Trash2 className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-sm text-muted mb-1">Tỷ lệ lãng phí</h3>
                <p className="text-2xl font-bold text-orange-600">{reportService.formatPercentage(summary.wasteRate)}</p>
                <p className="text-xs text-muted mt-1">
                  Giá trị lãng phí: {reportService.formatCurrency(summary.wasteValue)}
                </p>
              </div>

              <div className="card card-hover">
                <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-lg mb-4 inline-block">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-sm text-muted mb-1">Tỷ lệ hết hạn</h3>
                <p className="text-2xl font-bold text-red-600">{reportService.formatPercentage(summary.expiryRate)}</p>
                <p className="text-xs text-muted mt-1">
                  {summary.expiredProducts} sản phẩm đã hết hạn
                </p>
              </div>

              <div className="card card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  {getTrendIcon(summary.wasteRateTrend)}
                </div>
                <h3 className="text-sm text-muted mb-1">Chỉ số lãng phí tổng thể</h3>
                <p className="text-2xl font-bold text-purple-600">{summary.overallWasteIndex.toFixed(1)}</p>
                <p className="text-xs text-muted mt-1">
                  Xu hướng: {summary.wasteRateTrend}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Waste by Category Chart */}
      <div className="card mb-6">
        <h2 className="heading-secondary mb-4">Lãng phí theo Danh mục</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData.slice(0, 8) as any[]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoryName" angle={-45} textAnchor="end" height={100} />
            <YAxis tickFormatter={(value: unknown) => `${Number(value).toFixed(0)}%`} />
            <Tooltip
              formatter={(value: any, name: string) => {
                if (name === 'wasteIndex') return [`${Number(value).toFixed(2)}%`, 'Chỉ số lãng phí'];
                if (name === 'wasteRate') return [`${Number(value).toFixed(2)}%`, 'Tỷ lệ lãng phí'];
                if (name === 'expiryRate') return [`${Number(value).toFixed(2)}%`, 'Tỷ lệ hết hạn'];
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

      {/* Lãng phí theo danh mục Table */}
      <div className="card overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="heading-secondary">Lãng phí theo Danh mục</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-surface-light">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Tên danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Tổng sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Sản phẩm hết hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Lượng hết hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Giá trị lãng phí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Tỷ lệ lãng phí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Chỉ số lãng phí</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.map((category) => (
                <tr key={category.categoryId} className="hover:bg-surface-light transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {category.categoryImageUrl && (
                        <img src={category.categoryImageUrl} alt={category.categoryName} className="w-10 h-10 rounded-lg mr-3" />
                      )}
                      <span className="text-sm font-medium text-gray-900">{category.categoryName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.totalProducts.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{category.expiredProducts.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.expiredQuantity.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{reportService.formatCurrency(category.wasteValue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${category.wasteRate >= 50 ? 'text-red-600' : category.wasteRate >= 30 ? 'text-orange-600' : 'text-[#2F855A]'}`}>
                      {reportService.formatPercentage(category.wasteRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.wasteIndex.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lãng phí theo nhà cung cấp Table */}
      <div className="card overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="heading-secondary">Lãng phí theo Nhà cung cấp</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-surface-light">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Tên nhà cung cấp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Tổng sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Sản phẩm hết hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Lượng hết hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Giá trị lãng phí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Tỷ lệ bán qua</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Tỷ lệ lãng phí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Xếp hạng hiệu suất</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplierData.map((supplier) => (
                <tr key={supplier.supplierId} className="hover:bg-surface-light transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {supplier.avatarUrl && (
                        <img src={supplier.avatarUrl} alt={supplier.supplierName} className="w-10 h-10 rounded-full mr-3" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{supplier.supplierName}</p>
                        <p className="text-xs text-muted">{supplier.totalStores} cửa hàng</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.totalProducts.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{supplier.expiredProducts.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.expiredQuantity.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{reportService.formatCurrency(supplier.wasteValue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${supplier.sellThroughRate >= 70 ? 'text-[#2F855A]' : supplier.sellThroughRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {reportService.formatPercentage(supplier.sellThroughRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reportService.formatPercentage(supplier.wasteRate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${supplier.performanceRating === 'EXCELLENT' ? 'bg-green-100 text-green-800' :
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
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="heading-secondary">Hàng tồn kho chưa bán ({totalElements} sản phẩm)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-surface-light">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Tên sản phẩm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Nhà cung cấp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Số lượng tồn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Giá gốc</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Giá giảm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Giá trị tồn kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Ngày hết hạn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Ngày còn lại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">DT tiềm năng bị mất</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unsoldInventory.map((item) => (
                <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-surface-light transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-muted">{item.variantName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.supplierName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.categoryName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">{item.currentStock}</span>
                      <p className="text-xs text-muted">Ban đầu: {item.initialStock}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reportService.formatCurrency(item.originalPrice)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2F855A] font-semibold">{reportService.formatCurrency(item.discountPrice)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{reportService.formatCurrency(item.estimatedWasteValue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.expiryDate ? (
                      <div className="text-sm">
                        <p className="text-gray-900">{new Date(item.expiryDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted">Không rõ</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.daysUntilExpiry !== null && (
                      <p className={`text-sm flex items-center gap-1 ${item.daysUntilExpiry <= 2 ? 'text-red-600 font-semibold' : item.daysUntilExpiry <= 7 ? 'text-orange-600' : 'text-gray-600'}`}>
                        <Calendar className="w-3 h-3" />
                        {item.daysUntilExpiry <= 0 ? 'Đã hết hạn' : `${item.daysUntilExpiry} ngày`}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{reportService.formatCurrency(item.potentialRevenueLoss)}</td>
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
    </DashboardLayout>
  );
}
