import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Clock, Users, DollarSign, CreditCard, RefreshCw, Calendar, Store, User } from 'lucide-react';
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Báo cáo đối soát</h1>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Làm mới
          </button>
        </div>

        {/* System Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng số dư hệ thống</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {walletService.formatVND(summary?.totalBalance || 0)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Số dư khả dụng</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {walletService.formatVND(summary?.totalAvailableBalance || 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ xử lý</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  {walletService.formatVND(summary?.totalPendingBalance || 0)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng số ví</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {summary?.totalWallets || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Hoạt động: {summary?.totalActiveWallets || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Doanh thu tháng</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-500">Chi trả cho NCC</p>
                </div>
                <p className="text-xs text-gray-400">(Sau trừ hoa hồng)</p>
                <p className="text-xl font-bold text-green-600">
                  {walletService.formatVND(summary?.monthlyEarnings || 0)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <p className="text-sm text-gray-500">Doanh thu Platform</p>
                </div>
                <p className="text-xs text-blue-500">(Hoa hồng SaveFood thu)</p>
                <p className="text-xl font-bold text-blue-600">
                  {walletService.formatVND(summary?.monthlyCommissionEarned || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Thống kê tổng</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-500">Tổng thu nhập</p>
                </div>
                <p className="text-xl font-bold">
                  {walletService.formatVND(summary?.totalEarnings || 0)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-gray-500">Đã rút</p>
                </div>
                <p className="text-xl font-bold text-red-600">
                  {walletService.formatVND(summary?.totalWithdrawn || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Trung bình</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-500">Số dư trung bình/ví</p>
                </div>
                <p className="text-xl font-bold">
                  {walletService.formatVND(summary?.averageWalletBalance || 0)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-500">Thu nhập tháng TB</p>
                </div>
                <p className="text-xl font-bold">
                  {walletService.formatVND(summary?.averageMonthlyEarnings || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reconciliation Report */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Báo cáo đối soát</h3>
          </div>

          {/* Date Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-700">Thông tin đơn hàng</h4>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Tổng giá trị đơn hàng:</span>
                <span className="font-semibold">{walletService.formatVND(reconciliation?.totalOrderValue || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Số đơn hàng:</span>
                <span className="font-semibold">{reconciliation?.totalOrders || 0} đơn</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Tổng hoa hồng:</span>
                <span className="font-semibold text-blue-600">{walletService.formatVND(reconciliation?.totalCommission || 0)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-700">Thanh toán & Hoàn tiền</h4>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Đã trả NCC:</span>
                <span className="font-semibold text-green-600">{walletService.formatVND(reconciliation?.totalPaidToSuppliers || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Chờ thanh toán:</span>
                <span className="font-semibold text-yellow-600">{walletService.formatVND(reconciliation?.pendingPayments || 0)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Đã hoàn tiền:</span>
                <span className="font-semibold text-red-600">{walletService.formatVND(reconciliation?.totalRefunded || 0)}</span>
              </div>
            </div>
          </div>

          {/* Platform Revenue */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-blue-800" />
              <h4 className="font-semibold text-blue-800">Doanh thu nền tảng</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-blue-600">Thu nhập</p>
                <p className="text-lg font-bold text-blue-800">
                  {walletService.formatVND(reconciliation?.platformRevenue || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Chi phí</p>
                <p className="text-lg font-bold text-blue-800">
                  {walletService.formatVND(reconciliation?.platformExpenses || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Lợi nhuận ròng</p>
                <p className="text-lg font-bold text-green-600">
                  {walletService.formatVND(reconciliation?.netPlatformRevenue || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Breakdown Table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-700">Chi tiết theo nhà cung cấp</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số đơn</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doanh thu gộp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div>Hoa hồng Platform</div>
                      <div className="text-[10px] font-normal text-blue-500 normal-case">(SaveFood thu)</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div>Thanh toán NCC</div>
                      <div className="text-[10px] font-normal text-green-500 normal-case">(Ròng sau hoa hồng)</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoàn tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reconciliation?.supplierBreakdown && reconciliation.supplierBreakdown.length > 0 ? (
                    reconciliation.supplierBreakdown.map((supplier) => (
                      <tr key={supplier.supplierId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{supplier.supplierName}</div>
                          <div className="text-sm text-gray-500">{supplier.storeName}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{supplier.orderCount}</td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {walletService.formatVND(supplier.totalEarnings)}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-semibold">
                          {walletService.formatVND(supplier.commission)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          {walletService.formatVND(supplier.netEarnings)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600">
                          {walletService.formatVND(supplier.refunded)}
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
      </div>
    </DashboardLayout>
  );
}
