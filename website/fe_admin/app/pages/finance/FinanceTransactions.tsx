import { useEffect, useState } from 'react';
import { DollarSign, CheckCircle, XCircle, CreditCard, RefreshCw, X, Store, Calendar, Eye, FileText } from 'lucide-react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import walletService from '~/service/walletService';
import type { TransactionResponse } from '~/service/walletService';

export default function FinanceTransactions() {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [type, setType] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionResponse | null>(null);


  const [stats, setStats] = useState({
    totalCommissionEarned: 0,
    totalPaidToSuppliers: 0,
    totalRefunded: 0,
    totalTransactions: 0,
  });

  useEffect(() => {
    loadTransactions();
    loadSystemStats(); // Load system-wide stats instead of page-specific
  }, [page, type, supplierId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await walletService.getAllTransactions({
        page,
        size: 15,
        transactionType: type || undefined,
        supplierId: supplierId || undefined,
      });
      setTransactions(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      // Get system-wide statistics from summary endpoint
      const summary = await walletService.getSystemSummary();
      
      setStats({
        totalCommissionEarned: summary.totalCommissionEarned || 0,
        totalPaidToSuppliers: summary.totalEarnings || 0, // Total earnings paid to suppliers
        totalRefunded: summary.totalRefunded || 0,
        totalTransactions: transactions.length, // Keep page-specific count for context
      });
    } catch (err) {
      console.error('Failed to load system stats:', err);
    }
  };

  const handleFilterChange = () => {
    setPage(0);
  };

  const getTransactionColor = (transaction: TransactionResponse) => {
    if (transaction.transactionType === 'COMMISSION_FEE') {
      return 'text-blue-600'; // Platform earns
    } else if (transaction.transactionType === 'ORDER_COMPLETED') {
      return 'text-green-600'; // Supplier earns
    } else if (transaction.transactionType === 'ORDER_REFUND' || transaction.transactionType === 'COMMISSION_REFUND') {
      return 'text-red-600'; // Refunds
    }
    return transaction.amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Lịch sử Giao dịch - Toàn hệ thống</h1>
          <p className="text-gray-600">Theo dõi tất cả giao dịch ví của nhà cung cấp</p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <p className="text-blue-100 text-sm">Hoa hồng Platform</p>
                </div>
                <p className="text-2xl font-bold mt-1">{walletService.formatVND(stats.totalCommissionEarned)}</p>
                <p className="text-blue-100 text-xs mt-1">Doanh thu từ commission</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <p className="text-green-100 text-sm">Đã trả NCC</p>
                </div>
                <p className="text-2xl font-bold mt-1">{walletService.formatVND(stats.totalPaidToSuppliers)}</p>
                <p className="text-green-100 text-xs mt-1">Thanh toán nhà cung cấp</p>
              </div>
              <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4" />
                  <p className="text-red-100 text-sm">Đã hoàn tiền</p>
                </div>
                <p className="text-2xl font-bold mt-1">{walletService.formatVND(stats.totalRefunded)}</p>
                <p className="text-red-100 text-xs mt-1">Refund & cancellation</p>
              </div>
              <div className="bg-red-400 bg-opacity-30 p-3 rounded-full">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4" />
                  <p className="text-purple-100 text-sm">Tổng GD</p>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.totalTransactions}</p>
                <p className="text-purple-100 text-xs mt-1">Trên toàn hệ thống</p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); handleFilterChange(); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="ORDER_COMPLETED">✅ Đơn hàng hoàn thành</option>
                <option value="COMMISSION_FEE">💳 Phí hoa hồng Platform</option>
                <option value="COMMISSION_REFUND">↩️ Hoàn hoa hồng (đơn hủy)</option>
                <option value="ORDER_REFUND">❌ Hoàn tiền đơn hủy</option>
                <option value="WITHDRAWAL">💸 Rút tiền</option>
                <option value="BALANCE_RELEASE">🔓 Giải ngân</option>
                <option value="ADJUSTMENT">🔧 Điều chỉnh</option>
                <option value="PENALTY">⚠️ Phạt</option>
                <option value="BONUS">🎁 Thưởng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier ID (tùy chọn)</label>
              <input
                type="text"
                value={supplierId}
                onChange={(e) => { setSupplierId(e.target.value); handleFilterChange(); }}
                placeholder="Nhập ID nhà cung cấp..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={loadTransactions}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới
              </button>
              <button
                onClick={() => { setType(''); setSupplierId(''); setPage(0); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-semibold">Không có giao dịch nào</p>
              <p className="text-sm text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc quay lại sau</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã GD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhà cung cấp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-semibold text-gray-900">{transaction.supplierName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{transaction.supplierId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {walletService.getTransactionTypeLabel(transaction.transactionType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-bold ${getTransactionColor(transaction)}`}>
                          {transaction.amount >= 0 ? '+' : ''}{walletService.formatVND(transaction.amount)}
                        </span>
                        {transaction.transactionType === 'COMMISSION_FEE' && (
                          <div className="text-xs text-blue-500">→ Platform</div>
                        )}
                        {transaction.transactionType === 'ORDER_COMPLETED' && (
                          <div className="text-xs text-green-500">→ Supplier</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.orderId ? (
                          <span className="text-blue-600 font-medium">#{transaction.orderId}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Trang {page + 1} / {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold">Chi tiết giao dịch</h3>
                </div>
                <button onClick={() => setSelectedTransaction(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Mã giao dịch:</span>
                  <span className="font-semibold">#{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Store className="w-4 h-4" />
                    <span>Nhà cung cấp:</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{selectedTransaction.supplierName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{selectedTransaction.supplierId}</div>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Loại:</span>
                  <span className="font-semibold">{walletService.getTransactionTypeLabel(selectedTransaction.transactionType)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Số tiền:</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${getTransactionColor(selectedTransaction)}`}>
                      {selectedTransaction.amount >= 0 ? '+' : ''}{walletService.formatVND(selectedTransaction.amount)}
                    </span>
                    {selectedTransaction.transactionType === 'COMMISSION_FEE' && (
                      <div className="flex items-center gap-1 text-xs text-blue-500 mt-1 justify-end">
                        <DollarSign className="w-3 h-3" />
                        <span>Doanh thu Platform</span>
                      </div>
                    )}
                    {selectedTransaction.transactionType === 'ORDER_COMPLETED' && (
                      <div className="flex items-center gap-1 text-xs text-green-500 mt-1 justify-end">
                        <CheckCircle className="w-3 h-3" />
                        <span>Thanh toán cho NCC</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Số dư sau GD:</span>
                  <span className="font-semibold">{walletService.formatVND(selectedTransaction.balanceAfter)}</span>
                </div>
                {selectedTransaction.orderId && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-semibold text-blue-600">#{selectedTransaction.orderId}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Thời gian:</span>
                  </div>
                  <span className="font-semibold">{new Date(selectedTransaction.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                {selectedTransaction.description && (
                  <div className="py-2">
                    <span className="text-gray-600 block mb-1">Mô tả:</span>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">{selectedTransaction.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
