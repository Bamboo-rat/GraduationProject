import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Clock, Users, DollarSign, CreditCard, RefreshCw, Calendar, Store, User, ArrowDownCircle } from 'lucide-react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import walletService from '~/service/walletService';
import type { SystemWalletSummaryResponse, ReconciliationResponse } from '~/service/walletService';

export default function FinanceReconciliation() {
  const [summary, setSummary] = useState<SystemWalletSummaryResponse | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, reconData] = await Promise.all([
        walletService.getSystemSummary(),
        walletService.getReconciliation({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      ]);
      setSummary(summaryData);
      setReconciliation(reconData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  // Tính toán các giá trị
  const totalOrderValue = reconciliation?.totalOrderValue || 0;
  const totalRefunded = reconciliation?.totalRefunded || 0;
  const totalCommission = reconciliation?.totalCommission || 0;
  const actualRevenue = totalOrderValue - totalRefunded;
  const supplierPayment = actualRevenue - totalCommission;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A8D5BA]"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#2D3748]">Báo cáo đối soát</h1>
            <p className="text-[#718096] mt-1">Quản lý và theo dõi tài chính hệ thống</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-[#A8D5BA] text-[#2D3748] rounded-xl hover:bg-[#8BBF9E] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {/* Tổng quan hệ thống */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#2D7D46]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số dư</p>
                <p className="text-2xl font-bold text-[#2D3748]">
                  {walletService.formatVND(summary?.totalBalance || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#E3F2FD] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#1976D2]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Khả dụng</p>
                <p className="text-2xl font-bold text-[#2D3748]">
                  {walletService.formatVND(summary?.totalAvailableBalance || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#FFF3E0] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#F57C00]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
                <p className="text-2xl font-bold text-[#2D3748]">
                  {walletService.formatVND(summary?.totalPendingBalance || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#F3E5F5] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#7B1FA2]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số ví</p>
                <p className="text-2xl font-bold text-[#2D3748]">
                  {summary?.totalWallets || 0}
                </p>
                <p className="text-xs text-gray-500">Hoạt động: {summary?.totalActiveWallets || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bộ lọc thời gian */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2D3748] mb-4">Lọc theo thời gian</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-[#A8D5BA] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-[#A8D5BA] transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-[#A8D5BA] text-[#2D3748] rounded-lg hover:bg-[#8BBF9E] transition-colors font-medium"
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* Tính toán doanh thu - Phần quan trọng nhất */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2D3748] mb-6">Tính toán doanh thu</h3>
          
          <div className="space-y-4">
            {/* Doanh thu gốc */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E3F2FD] flex items-center justify-center">
                  <Store className="w-4 h-4 text-[#1976D2]" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">Doanh thu gốc từ đơn hàng</p>
                  <p className="text-sm text-gray-500">{reconciliation?.totalOrders || 0} đơn hàng</p>
                </div>
              </div>
              <p className="text-lg font-bold text-[#1976D2]">
                {walletService.formatVND(totalOrderValue)}
              </p>
            </div>

            {/* Trừ hoàn tiền */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFEBEE] flex items-center justify-center">
                  <ArrowDownCircle className="w-4 h-4 text-[#C53030]" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">Hoàn tiền đơn hủy</p>
                  <p className="text-sm text-gray-500">{reconciliation?.refundCount || 0} lần hoàn tiền</p>
                </div>
              </div>
              <p className="text-lg font-bold text-[#C53030]">
                -{walletService.formatVND(totalRefunded)}
              </p>
            </div>

            {/* Doanh thu thực */}
            <div className="flex justify-between items-center py-3 border-b border-gray-200 bg-[#F8FFF9]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#2D7D46]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Doanh thu thực nhận</p>
                  <p className="text-sm text-[#2D7D46]">Sau khi trừ hoàn tiền</p>
                </div>
              </div>
              <p className="text-xl font-bold text-[#2D7D46]">
                {walletService.formatVND(actualRevenue)}
              </p>
            </div>

            {/* Trừ hoa hồng */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#F57C00]" />
                </div>
                <div>
                  <p className="font-medium text-gray-700">Hoa hồng nền tảng</p>
                  <p className="text-sm text-gray-500">Phí dịch vụ SaveFood</p>
                </div>
              </div>
              <p className="text-lg font-bold text-[#F57C00]">
                -{walletService.formatVND(totalCommission)}
              </p>
            </div>

            {/* Thanh toán cho NCC */}
            <div className="flex justify-between items-center py-3 bg-[#E8F5E9] rounded-lg px-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2D7D46] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Thanh toán cho nhà cung cấp</p>
                  <p className="text-sm text-[#2D7D46]">Số tiền thực nhận của NCC</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-[#2D7D46]">
                {walletService.formatVND(supplierPayment)}
              </p>
            </div>
          </div>
        </div>

        {/* Doanh thu nền tảng */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2D3748] mb-6">Doanh thu nền tảng SaveFood</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#E3F2FD] rounded-lg p-4 border border-[#BBDEFB]">
              <p className="text-sm font-medium text-[#1976D2] mb-2">Hoa hồng thu được</p>
              <p className="text-2xl font-bold text-[#1976D2]">
                {walletService.formatVND(reconciliation?.platformRevenue || 0)}
              </p>
            </div>

            <div className="bg-[#FFEBEE] rounded-lg p-4 border border-[#FFCDD2]">
              <p className="text-sm font-medium text-[#C53030] mb-2">Hoàn hồng</p>
              <p className="text-2xl font-bold text-[#C53030]">
                {walletService.formatVND(reconciliation?.platformExpenses || 0)}
              </p>
            </div>

            <div className="bg-[#E8F5E9] rounded-lg p-4 border border-[#C8E6C9]">
              <p className="text-sm font-medium text-[#2D7D46] mb-2">Lợi nhuận ròng</p>
              <p className="text-2xl font-bold text-[#2D7D46]">
                {walletService.formatVND(reconciliation?.netPlatformRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Tình trạng thanh toán */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#2D3748] mb-4">Tình trạng thanh toán NCC</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-[#2D7D46]" />
                  </div>
                  <span className="font-medium text-gray-700">Đã thanh toán</span>
                </div>
                <p className="text-lg font-bold text-[#2D7D46]">
                  {walletService.formatVND(reconciliation?.totalPaidToSuppliers || 0)}
                </p>
              </div>

              <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#F57C00]" />
                  </div>
                  <span className="font-medium text-gray-700">Chờ thanh toán</span>
                </div>
                <p className="text-lg font-bold text-[#F57C00]">
                  {walletService.formatVND(reconciliation?.pendingPayments || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#2D3748] mb-4">Thống kê tháng</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Doanh thu tháng</span>
                <span className="font-semibold">{walletService.formatVND(summary?.monthlyEarnings || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hoa hồng tháng</span>
                <span className="font-semibold">{walletService.formatVND(summary?.monthlyCommissionEarned || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã rút</span>
                <span className="font-semibold">{walletService.formatVND(summary?.totalWithdrawn || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chi tiết theo nhà cung cấp */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#2D3748] mb-4">Chi tiết theo nhà cung cấp</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nhà cung cấp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Số đơn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Doanh thu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hoàn tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hoa hồng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Thực nhận</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reconciliation?.supplierBreakdown && reconciliation.supplierBreakdown.length > 0 ? (
                  reconciliation.supplierBreakdown.map((supplier) => (
                    <tr key={supplier.supplierId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{supplier.supplierName}</div>
                        <div className="text-sm text-gray-500">{supplier.storeName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-700">{supplier.orderCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-[#1976D2]">
                          {walletService.formatVND(supplier.totalEarnings)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-[#C53030]">
                          {walletService.formatVND(supplier.refunded)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-[#F57C00]">
                          {walletService.formatVND(supplier.commission)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-[#2D7D46]">
                          {walletService.formatVND(supplier.netEarnings)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}