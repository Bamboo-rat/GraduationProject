import { useEffect, useState } from 'react';
import walletService from '~/service/walletService';
import type { WalletResponse } from '~/service/walletService';

export default function FinanceWithdraw() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const data = await walletService.getMyWallet();
      setWallet(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  // Get days until end of month
  const getDaysUntilEndOfMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diffTime = lastDay.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  const daysRemaining = getDaysUntilEndOfMonth();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chuyển khoản Tự động</h1>
        <button
          onClick={loadWallet}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🔄 Chuyển khoản Tự động Cuối Tháng
            </h3>
            <p className="text-blue-800 leading-relaxed">
              Hệ thống SaveFood tự động chuyển toàn bộ <strong>số dư khả dụng</strong> vào tài khoản ngân hàng của bạn vào <strong>cuối mỗi tháng</strong> (ngày 28-31).
              Bạn không cần yêu cầu rút tiền thủ công.
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                ⏰ Còn {daysRemaining} ngày đến kỳ chuyển tiền
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                ✓ Tự động
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Số dư khả dụng</h3>
            <div className="bg-green-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {walletService.formatVND(wallet?.availableBalance || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">💸 Sẽ chuyển cuối tháng</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Số dư chờ xử lý</h3>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {walletService.formatVND(wallet?.pendingBalance || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">⏳ Chuyển khả dụng sau 7 ngày</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Tổng số dư</h3>
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {walletService.formatVND(wallet?.totalBalance || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">= Khả dụng + Chờ xử lý</p>
        </div>
      </div>

      {/* Withdrawal Process Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Quy trình Chuyển tiền Tự động
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Đơn hàng hoàn thành</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Tiền vào <strong>số dư chờ xử lý</strong> (pending balance)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center font-bold text-yellow-600">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Sau 7 ngày</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Hệ thống tự động chuyển từ <strong>chờ xử lý</strong> → <strong>khả dụng</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-600">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Cuối tháng (ngày 28-31)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Hệ thống tự động chuyển <strong>toàn bộ số dư khả dụng</strong> vào tài khoản ngân hàng
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Thông tin Quan trọng
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <strong className="text-blue-900">Tự động 100%:</strong>
                <p className="text-blue-700 mt-1">Không cần yêu cầu rút tiền, hệ thống tự động chuyển khoản cho bạn</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-yellow-50 p-3 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <strong className="text-yellow-900">Số dư tối thiểu:</strong>
                <p className="text-yellow-700 mt-1">Không có giới hạn tối thiểu, mọi số tiền đều được chuyển</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div className="text-sm">
                <strong className="text-green-900">Thời gian xử lý:</strong>
                <p className="text-green-700 mt-1">1-3 ngày làm việc kể từ ngày chuyển khoản</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
              <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <div className="text-sm">
                <strong className="text-purple-900">Thông tin ngân hàng:</strong>
                <p className="text-purple-700 mt-1">Cập nhật trong phần <strong>Cài đặt</strong> của bạn</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Thống kê Tài chính</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tổng thu nhập</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {walletService.formatVND(wallet?.totalEarnings || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Thu nhập tháng này</p>
            <p className="text-xl font-bold text-blue-600 mt-1">
              {walletService.formatVND(wallet?.monthlyEarnings || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Đã rút (tự động)</p>
            <p className="text-xl font-bold text-green-600 mt-1">
              {walletService.formatVND(wallet?.totalWithdrawn || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Đã hoàn trả</p>
            <p className="text-xl font-bold text-red-600 mt-1">
              {walletService.formatVND(wallet?.totalRefunded || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
