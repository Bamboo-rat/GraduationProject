import { useEffect, useState } from 'react';
import walletService from '~/service/walletService';
import type { TransactionResponse } from '~/service/walletService';

export default function FinanceTransactions() {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionResponse | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [page, type, status]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await walletService.getMyTransactions({
        page,
        size: 10,
        transactionType: type || undefined,
      });
      setTransactions(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setPage(0);
  };

  // Filter transactions on client side (status filter not supported by API)
  const filteredTransactions = transactions.filter((tx) => {
    if (status && tx.status !== status) return false;
    return true;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Lịch sử giao dịch</h1>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); handleFilterChange(); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="PENDING">Đang xử lý</option>
              <option value="FAILED">Thất bại</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setType(''); setStatus(''); setPage(0); }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
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
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Không có giao dịch nào</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Không tìm thấy giao dịch phù hợp với bộ lọc</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã GD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {walletService.getTransactionTypeLabel(transaction.transactionType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={transaction.amount >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {transaction.amount >= 0 ? '+' : ''}{walletService.formatVND(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${walletService.getTransactionStatusColor(transaction.status)}`}>
                        {walletService.getTransactionStatusLabel(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-800"
                      >
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
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
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
              <h3 className="text-xl font-bold">Chi tiết giao dịch</h3>
              <button onClick={() => setSelectedTransaction(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Mã giao dịch:</span>
                <span className="font-semibold">#{selectedTransaction.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Loại:</span>
                <span className="font-semibold">{walletService.getTransactionTypeLabel(selectedTransaction.transactionType)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Số tiền:</span>
                <span className={`font-bold text-lg ${selectedTransaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTransaction.amount >= 0 ? '+' : ''}{walletService.formatVND(selectedTransaction.amount)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Số dư sau GD:</span>
                <span className="font-semibold">{walletService.formatVND(selectedTransaction.balanceAfter)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Trạng thái:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${walletService.getTransactionStatusColor(selectedTransaction.status)}`}>
                  {walletService.getTransactionStatusLabel(selectedTransaction.status)}
                </span>
              </div>
              {selectedTransaction.orderId && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-semibold">#{selectedTransaction.orderId}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Thời gian:</span>
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
  );
}
