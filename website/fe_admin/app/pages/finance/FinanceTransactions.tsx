import { useEffect, useState } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import walletService from '~/service/walletService';
import type { TransactionResponse } from '~/service/walletService';
import { usePermissions } from '~/hooks/usePermissions';

export default function FinanceTransactions() {
  const { can } = usePermissions();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
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
  }, [page, type, supplierId]);

  useEffect(() => {
    loadSystemStats();
  }, []);

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
      setTotalElements(data.totalElements); 
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const summary = await walletService.getSystemSummary();
      
      setStats({
        totalCommissionEarned: summary.totalCommissionEarned || 0,
        totalPaidToSuppliers: summary.totalEarnings || 0,
        totalRefunded: summary.totalRefunded || 0,
        totalTransactions: 0, 
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
      return 'text-[#FF9AA2]';
    } else if (transaction.transactionType === 'ORDER_COMPLETED') {
      return 'text-[#2D7D46]';
    } else if (transaction.transactionType === 'ORDER_REFUND' || transaction.transactionType === 'COMMISSION_REFUND') {
      return 'text-[#F57C00]';
    }
    return transaction.amount >= 0 ? 'text-[#2D7D46]' : 'text-[#FF9AA2]';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2D3748] mb-2">Lịch sử giao dịch - Toàn hệ thống</h1>
          <p className="text-[#718096]">Theo dõi tất cả giao dịch ví của nhà cung cấp</p>
        </div>

        {/* Statistics Overview - No Icons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#FFEBEE] rounded-xl border border-[#FFCDD2] p-4">
            <div>
              <p className="text-[#C53030] text-sm font-medium mb-1">Hoa hồng Platform</p>
              <p className="text-2xl font-bold text-[#2D3748]">{walletService.formatVND(stats.totalCommissionEarned)}</p>
              <p className="text-[#718096] text-xs mt-1">Hoa hồng thực nhận</p>
            </div>
          </div>

          <div className="bg-[#E8F5E9] rounded-xl border border-[#C8E6C9] p-4">
            <div>
              <p className="text-[#2D7D46] text-sm font-medium mb-1">Đã trả NCC</p>
              <p className="text-2xl font-bold text-[#2D3748]">{walletService.formatVND(stats.totalPaidToSuppliers)}</p>
              <p className="text-[#718096] text-xs mt-1">Thanh toán nhà cung cấp</p>
            </div>
          </div>

          <div className="bg-[#FFF3E0] rounded-xl border border-[#FFE0B2] p-4">
            <div>
              <p className="text-[#F57C00] text-sm font-medium mb-1">Đã hoàn tiền</p>
              <p className="text-2xl font-bold text-[#2D3748]">{walletService.formatVND(stats.totalRefunded)}</p>
              <p className="text-[#718096] text-xs mt-1">Hoàn tiền & hủy đơn</p>
            </div>
          </div>

          <div className="bg-[#F3E5F5] rounded-xl border border-[#E1BEE7] p-4">
            <div>
              <p className="text-[#7B1FA2] text-sm font-medium mb-1">Tổng giao dịch</p>
              <p className="text-2xl font-bold text-[#2D3748]">{totalElements.toLocaleString('vi-VN')}</p>
              <p className="text-[#718096] text-xs mt-1">
                {type || supplierId ? 'Theo bộ lọc' : 'Toàn hệ thống'}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value); handleFilterChange(); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-[#A8D5BA] transition-all"
              >
                <option value="">Tất cả</option>
                <option value="ORDER_COMPLETED">Đơn hàng hoàn thành</option>
                <option value="COMMISSION_FEE">Phí hoa hồng Platform</option>
                <option value="COMMISSION_REFUND">Hoàn hoa hồng (đơn hủy)</option>
                <option value="ORDER_REFUND">Hoàn tiền đơn hủy</option>
                <option value="WITHDRAWAL">Rút tiền</option>
                <option value="BALANCE_RELEASE">Giải ngân</option>
                <option value="ADJUSTMENT">Điều chỉnh</option>
                <option value="PENALTY">Phạt</option>
                <option value="BONUS">Thưởng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier ID (tùy chọn)</label>
              <input
                type="text"
                value={supplierId}
                onChange={(e) => { setSupplierId(e.target.value); handleFilterChange(); }}
                placeholder="Nhập ID nhà cung cấp..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] focus:border-[#A8D5BA] transition-all"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={loadTransactions}
                className="flex-1 px-4 py-2 bg-[#A8D5BA] text-[#2D3748] rounded-lg hover:bg-[#8BBF9E] transition font-medium"
              >
                Làm mới
              </button>
              <button
                onClick={() => { setType(''); setSupplierId(''); setPage(0); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A8D5BA]"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
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
                          <div className="text-xs text-[#FF9AA2]">→ Platform</div>
                        )}
                        {transaction.transactionType === 'ORDER_COMPLETED' && (
                          <div className="text-xs text-[#2D7D46]">→ Supplier</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.orderId ? (
                          <span className="text-[#1976D2] font-medium">#{transaction.orderId}</span>
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
                          className="text-[#1976D2] hover:text-[#1565C0] font-medium transition-colors"
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
                Trang {page + 1} / {totalPages} • Hiển thị {transactions.length} / {totalElements.toLocaleString('vi-VN')} giao dịch
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#2D3748]">Chi tiết giao dịch</h3>
                <button 
                  onClick={() => setSelectedTransaction(null)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Mã giao dịch:</span>
                  <span className="font-semibold text-[#2D3748]">#{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Nhà cung cấp:</span>
                  <div className="text-right">
                    <div className="font-semibold text-[#2D3748]">{selectedTransaction.supplierName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{selectedTransaction.supplierId}</div>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Loại:</span>
                  <span className="font-semibold text-[#2D3748]">{walletService.getTransactionTypeLabel(selectedTransaction.transactionType)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Số tiền:</span>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${getTransactionColor(selectedTransaction)}`}>
                      {selectedTransaction.amount >= 0 ? '+' : ''}{walletService.formatVND(selectedTransaction.amount)}
                    </span>
                    {selectedTransaction.transactionType === 'COMMISSION_FEE' && (
                      <div className="text-xs text-[#FF9AA2] mt-1">Doanh thu Platform</div>
                    )}
                    {selectedTransaction.transactionType === 'ORDER_COMPLETED' && (
                      <div className="text-xs text-[#2D7D46] mt-1">Thanh toán cho NCC</div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Số dư sau GD:</span>
                  <span className="font-semibold text-[#2D3748]">{walletService.formatVND(selectedTransaction.balanceAfter)}</span>
                </div>
                {selectedTransaction.orderId && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-semibold text-[#1976D2]">#{selectedTransaction.orderId}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-semibold text-[#2D3748]">{new Date(selectedTransaction.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                {selectedTransaction.description && (
                  <div className="py-2">
                    <span className="text-gray-600 block mb-1">Mô tả:</span>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedTransaction.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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