import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import walletService from '~/service/walletService';
import reportService from '~/service/reportService';
import orderService from '~/service/orderService';
import type { WalletSummaryResponse } from '~/service/walletService';
import type { PartnerPerformanceMetrics } from '~/service/reportService';

export default function DashboardOverview() {
  const [wallet, setWallet] = useState<WalletSummaryResponse | null>(null);
  const [performance, setPerformance] = useState<PartnerPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [walletData, performanceData] = await Promise.all([
        walletService.getWalletSummary(),
        reportService.getMyPerformance(),
      ]);
      setWallet(walletData);
      setPerformance(performanceData);
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

  const stats = [
    {
      title: 'Doanh thu tháng này',
      value: wallet?.monthlyEarnings || 0,
      formatted: walletService.formatVND(wallet?.monthlyEarnings || 0),
      icon: DollarSign,
      color: 'from-[#A4C3A2] to-[#2F855A]',
      textColor: 'text-[#2F855A]',
      bgColor: 'bg-[#E8FFED]',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Đơn hàng tháng này',
      value: wallet?.totalOrdersThisMonth || 0,
      formatted: wallet?.totalOrdersThisMonth?.toString() || '0',
      icon: ShoppingCart,
      color: 'from-[#8FB491] to-[#A4C3A2]',
      textColor: 'text-[#8FB491]',
      bgColor: 'bg-[#E8FFED]',
      trend: '+8.2%',
      trendUp: true,
    },
    {
      title: 'Sản phẩm đang bán',
      value: performance?.activeProducts || 0,
      formatted: performance?.activeProducts?.toString() || '0',
      icon: Package,
      color: 'from-[#FF6B35] to-[#E63946]',
      textColor: 'text-[#FF6B35]',
      bgColor: 'bg-[#FFF3E8]',
      trend: `${performance?.totalProducts || 0} tổng`,
      trendUp: false,
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: performance?.orderCompletionRate || 0,
      formatted: `${(performance?.orderCompletionRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-[#B7E4C7] to-[#A4C3A2]',
      textColor: 'text-[#2F855A]',
      bgColor: 'bg-[#E8FFED]',
      trend: 'Hoàn thành',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Tổng quan Dashboard</h1>
          <p className="text-[#6B6B6B] mt-1">Chào mừng trở lại! Đây là tình hình hoạt động của bạn</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-[#B7E4C7] rounded-xl bg-white text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
          >
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="thisMonth">Tháng này</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stat.bgColor} ${stat.textColor}`}>
                {stat.trendUp ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                {stat.trend}
              </div>
            </div>
            <h3 className="text-[#6B6B6B] text-sm font-medium mb-2">{stat.title}</h3>
            <p className="text-2xl font-bold text-[#2D2D2D]">{stat.formatted}</p>
          </div>
        ))}
      </div>

      {/* Revenue & Balance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-900">Số dư khả dụng</h3>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-700 mb-2">
            {walletService.formatVND(wallet?.availableBalance || 0)}
          </p>
          <p className="text-sm text-green-600">Có thể rút ngay</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-yellow-900">Số dư chờ xử lý</h3>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-700 mb-2">
            {walletService.formatVND(wallet?.pendingBalance || 0)}
          </p>
          <p className="text-sm text-yellow-600">Sẽ được giải ngân sau 7 ngày</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Hoa hồng Platform</h3>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-700 mb-2">
            {wallet?.commissionRate || 10}%
          </p>
          <p className="text-sm text-blue-600">
            Tháng này: {walletService.formatVND(wallet?.estimatedCommissionThisMonth || 0)}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
        <h2 className="text-xl font-semibold text-[#2D2D2D] mb-4">Hiệu suất hoạt động</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[#F8FFF9] rounded-xl">
            <p className="text-sm text-[#6B6B6B] mb-1">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-[#2D2D2D]">{performance?.totalOrders || 0}</p>
          </div>
          <div className="text-center p-4 bg-[#F8FFF9] rounded-xl">
            <p className="text-sm text-[#6B6B6B] mb-1">Đã hoàn thành</p>
            <p className="text-2xl font-bold text-green-600">{performance?.completedOrders || 0}</p>
          </div>
          <div className="text-center p-4 bg-[#F8FFF9] rounded-xl">
            <p className="text-sm text-[#6B6B6B] mb-1">Đã hủy</p>
            <p className="text-2xl font-bold text-red-600">{performance?.cancelledOrders || 0}</p>
          </div>
          <div className="text-center p-4 bg-[#F8FFF9] rounded-xl">
            <p className="text-sm text-[#6B6B6B] mb-1">Doanh thu tổng</p>
            <p className="text-2xl font-bold text-[#2F855A]">
              {reportService.formatVND(performance?.totalRevenue || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#E8FFED] to-[#D9FFDF] rounded-2xl p-6 border border-[#B7E4C7]">
        <h2 className="text-lg font-semibold text-[#2D2D2D] mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a
            href="/products/create"
            className="bg-white hover:bg-[#F8FFF9] rounded-xl p-4 flex flex-col items-center space-y-2 transition-all border border-[#B7E4C7]"
          >
            <Package className="w-6 h-6 text-[#2F855A]" />
            <span className="text-sm font-medium text-[#2D2D2D]">Thêm sản phẩm</span>
          </a>
          <a
            href="/reports/revenue-over-time"
            className="bg-white hover:bg-[#F8FFF9] rounded-xl p-4 flex flex-col items-center space-y-2 transition-all border border-[#B7E4C7]"
          >
            <TrendingUp className="w-6 h-6 text-[#2F855A]" />
            <span className="text-sm font-medium text-[#2D2D2D]">Xem báo cáo</span>
          </a>
          <a
            href="/orders/list"
            className="bg-white hover:bg-[#F8FFF9] rounded-xl p-4 flex flex-col items-center space-y-2 transition-all border border-[#B7E4C7]"
          >
            <ShoppingCart className="w-6 h-6 text-[#2F855A]" />
            <span className="text-sm font-medium text-[#2D2D2D]">Đơn hàng</span>
          </a>
          <a
            href="/settings/settings"
            className="bg-white hover:bg-[#F8FFF9] rounded-xl p-4 flex flex-col items-center space-y-2 transition-all border border-[#B7E4C7]"
          >
            <Package className="w-6 h-6 text-[#2F855A]" />
            <span className="text-sm font-medium text-[#2D2D2D]">Cài đặt</span>
          </a>
        </div>
      </div>
    </div>
  );
}
