import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShoppingCart,
  Package,
  Star,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import reportService from '~/service/reportService';
import walletService from '~/service/walletService';
import type { PartnerPerformanceMetrics } from '~/service/reportService';
import type { WalletSummaryResponse } from '~/service/walletService';

export default function PerformanceAnalysis() {
  const [performance, setPerformance] = useState<PartnerPerformanceMetrics | null>(null);
  const [wallet, setWallet] = useState<WalletSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [performanceData, walletData] = await Promise.all([
        reportService.getMyPerformance(),
        walletService.getWalletSummary(),
      ]);
      setPerformance(performanceData);
      setWallet(walletData);
    } catch (err) {
      console.error('Failed to load performance data:', err);
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

  const performanceScore = performance
    ? Math.round((performance.orderCompletionRate + (100 - performance.orderCancellationRate)) / 2)
    : 0;

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'Xuất sắc', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (score >= 75) return { grade: 'Tốt', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (score >= 60) return { grade: 'Trung bình', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { grade: 'Cần cải thiện', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  const gradeInfo = getPerformanceGrade(performanceScore);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Phân tích & Đánh giá</h1>
          <p className="text-[#6B6B6B] mt-1">Đánh giá toàn diện hiệu suất hoạt động kinh doanh của bạn</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Performance Score Card */}
      <div className={`${gradeInfo.bgColor} border-2 ${gradeInfo.borderColor} rounded-2xl p-8`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Điểm hiệu suất tổng thể</h2>
            <div className="flex items-baseline gap-4">
              <span className={`text-6xl font-bold ${gradeInfo.color}`}>{performanceScore}</span>
              <span className="text-2xl text-gray-600">/100</span>
            </div>
            <p className={`text-xl font-semibold ${gradeInfo.color} mt-3`}>
              Xếp hạng: {gradeInfo.grade}
            </p>
          </div>
          <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-lg">
            <Activity className={`w-16 h-16 ${gradeInfo.color}`} />
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-2">Tỷ lệ hoàn thành</h3>
          <p className="text-3xl font-bold text-gray-900">
            {performance?.orderCompletionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-green-600 mt-2">
            {performance?.completedOrders || 0} / {performance?.totalOrders || 0} đơn
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-2">Tỷ lệ hủy</h3>
          <p className="text-3xl font-bold text-gray-900">
            {performance?.orderCancellationRate.toFixed(1)}%
          </p>
          <p className="text-xs text-red-600 mt-2">
            {performance?.cancelledOrders || 0} đơn bị hủy
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-2">Giá trị đơn TB</h3>
          <p className="text-3xl font-bold text-gray-900">
            {reportService.formatVND(performance?.averageOrderValue || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Trung bình mỗi đơn</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-2">Tổng doanh thu</h3>
          <p className="text-3xl font-bold text-gray-900">
            {reportService.formatVND(performance?.totalRevenue || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Từ {performance?.totalOrders || 0} đơn hàng</p>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store & Product Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#2F855A]" />
            Cửa hàng & Sản phẩm
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng cửa hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{performance?.totalStores || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-xl font-semibold text-green-600">{performance?.activeStores || 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold text-gray-900">{performance?.totalProducts || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Đang bán</p>
                <p className="text-xl font-semibold text-blue-600">{performance?.activeProducts || 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
              <div>
                <p className="text-sm text-orange-700 font-medium">Tỷ lệ sản phẩm active</p>
                <p className="text-lg font-semibold text-orange-800 mt-1">
                  {performance && performance.totalProducts > 0
                    ? ((performance.activeProducts / performance.totalProducts) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <Activity className="w-10 h-10 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#2F855A]" />
            Tài chính
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700 font-medium">Doanh thu tháng này</span>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-800">
                {walletService.formatVND(wallet?.monthlyEarnings || 0)}
              </p>
              <p className="text-xs text-green-600 mt-2">
                Từ {wallet?.totalOrdersThisMonth || 0} đơn hàng
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700 font-medium">Số dư khả dụng</span>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-800">
                {walletService.formatVND(wallet?.availableBalance || 0)}
              </p>
              <p className="text-xs text-blue-600 mt-2">Có thể rút ngay</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-yellow-700 font-medium">Số dư chờ xử lý</span>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-800">
                {walletService.formatVND(wallet?.pendingBalance || 0)}
              </p>
              <p className="text-xs text-yellow-600 mt-2">Chờ giải ngân sau 7 ngày</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
        <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6 flex items-center gap-2">
          <Star className="w-6 h-6 text-[#2F855A]" />
          Thông tin chi tiết
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">Điểm mạnh</h3>
            <ul className="space-y-2">
              {performance && performance.orderCompletionRate >= 85 && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Tỷ lệ hoàn thành đơn hàng cao</span>
                </li>
              )}
              {performance && performance.totalProducts >= 10 && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Danh mục sản phẩm đa dạng</span>
                </li>
              )}
              {performance && performance.activeStores > 0 && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Có cửa hàng đang hoạt động</span>
                </li>
              )}
              {(!performance || performance.orderCompletionRate < 85) && (
                <li className="text-sm text-gray-500 italic">Chưa đạt được điểm mạnh đáng kể</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">Cần cải thiện</h3>
            <ul className="space-y-2">
              {performance && performance.orderCancellationRate > 10 && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Tỷ lệ hủy đơn hàng cao</span>
                </li>
              )}
              {performance && performance.activeProducts < performance.totalProducts * 0.5 && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Nhiều sản phẩm không hoạt động</span>
                </li>
              )}
              {performance && performance.totalOrders < 10 && (
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Số lượng đơn hàng thấp</span>
                </li>
              )}
              {performance && performance.orderCancellationRate <= 10 && performance.activeProducts >= performance.totalProducts * 0.5 && performance.totalOrders >= 10 && (
                <li className="text-sm text-green-600 italic">Hiệu suất tốt, tiếp tục duy trì!</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">Khuyến nghị</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Cập nhật sản phẩm thường xuyên</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Xử lý đơn hàng nhanh chóng</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Duy trì chất lượng dịch vụ</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Business Info */}
      {performance && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Thông tin doanh nghiệp: {performance.businessName}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Ngày tham gia:</p>
                  <p className="font-semibold text-blue-900">
                    {reportService.formatDate(performance.joinDate)}
                  </p>
                </div>
                {performance.lastOrderDate && (
                  <div>
                    <p className="text-blue-700">Đơn gần nhất:</p>
                    <p className="font-semibold text-blue-900">
                      {reportService.formatDate(performance.lastOrderDate)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-blue-700">Tổng cửa hàng:</p>
                  <p className="font-semibold text-blue-900">{performance.totalStores}</p>
                </div>
                <div>
                  <p className="text-blue-700">Tổng sản phẩm:</p>
                  <p className="font-semibold text-blue-900">{performance.totalProducts}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
