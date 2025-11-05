import { useEffect, useState } from 'react';
import walletService from '~/service/walletService';
import type { WalletSummaryResponse } from '~/service/walletService';

export default function FinanceRevenue() {
  const [summary, setSummary] = useState<WalletSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWalletSummary();
  }, []);

  const loadWalletSummary = async () => {
    try {
      setLoading(true);
      const data = await walletService.getWalletSummary();
      setSummary(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Doanh thu & Hoa hồng</h1>
        <button
          onClick={loadWalletSummary}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Làm mới
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Số dư khả dụng</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {walletService.formatVND(summary?.availableBalance || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Có thể rút ngay</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Số dư chờ xử lý</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {walletService.formatVND(summary?.pendingBalance || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Chờ chuyển khả dụng</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng số dư</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {walletService.formatVND(summary?.totalBalance || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Khả dụng + Chờ xử lý</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Thu nhập tháng này</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Doanh thu tháng</span>
              <span className="font-semibold text-lg">
                {walletService.formatVND(summary?.monthlyEarnings || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Số đơn hàng</span>
              <span className="font-semibold text-lg">
                {summary?.totalOrdersThisMonth || 0} đơn
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Hoa hồng ước tính ({summary?.commissionRate}%)</span>
              <span className="font-semibold text-lg text-red-600">
                -{walletService.formatVND(summary?.estimatedCommissionThisMonth || 0)}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-gray-800 font-medium">Thu nhập ròng</span>
              <span className="font-bold text-xl text-green-600">
                {walletService.formatVND((summary?.monthlyEarnings || 0) - (summary?.estimatedCommissionThisMonth || 0))}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Thống kê tổng</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng thu nhập</span>
              <span className="font-semibold text-lg">
                {walletService.formatVND(summary?.totalEarnings || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đã rút</span>
              <span className="font-semibold text-lg">
                {walletService.formatVND(summary?.totalWithdrawn || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Đã hoàn trả</span>
              <span className="font-semibold text-lg text-red-600">
                {walletService.formatVND(summary?.totalRefunded || 0)}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${walletService.getStatusColor(summary?.status || 'ACTIVE')}`}>
                {summary?.status === 'ACTIVE' ? '✓ Hoạt động' : '⚠ Bị khóa'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Info */}
      {summary?.canWithdraw ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Có thể rút tiền</h3>
              <p className="text-sm text-green-700 mt-1">
                Bạn có thể rút tiền ngay bây giờ. Số tiền tối thiểu: {walletService.formatVND(summary.minimumWithdrawal)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Chưa đủ điều kiện rút tiền</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {summary?.status !== 'ACTIVE' 
                  ? 'Ví của bạn đang bị khóa' 
                  : `Số dư khả dụng chưa đạt mức tối thiểu (${walletService.formatVND(summary?.minimumWithdrawal || 50000)})`
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
