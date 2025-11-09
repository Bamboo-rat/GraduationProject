import { useEffect, useState } from 'react';
import walletService from '~/service/walletService';
import type { WalletResponse, ManualTransactionRequest } from '~/service/walletService';

export default function FinanceWallets() {
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<string>('');
  
  const [selectedWallet, setSelectedWallet] = useState<WalletResponse | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState<ManualTransactionRequest>({
    supplierId: '',
    transactionType: 'ADJUSTMENT',
    amount: 0,
    description: '',
  });

  useEffect(() => {
    loadWallets();
  }, [page, status]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await walletService.getAllWallets({
        page,
        size: 10,
        status: status || undefined,
      });
      setWallets(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (walletId: string, newStatus: string) => {
    if (!confirm(`Bạn có chắc chắn muốn ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'khóa'} ví này?`)) {
      return;
    }

    try {
      await walletService.updateWalletStatus(walletId, newStatus);
      alert('Cập nhật trạng thái thành công!');
      loadWallets();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await walletService.createManualTransaction(transactionForm);
      alert('Tạo giao dịch thành công!');
      setShowTransactionModal(false);
      setTransactionForm({
        supplierId: '',
        transactionType: 'ADJUSTMENT',
        amount: 0,
        description: '',
      });
      loadWallets();
    } catch (err: any) {
      alert(err.message || 'Không thể tạo giao dịch');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý ví nhà cung cấp</h1>
        <button
          onClick={() => setShowTransactionModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Tạo giao dịch thủ công
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="SUSPENDED">Bị khóa</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={loadWallets}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Làm mới
            </button>
            <button
              onClick={() => { setStatus(''); setPage(0); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : wallets.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Không có ví nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khả dụng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chờ xử lý</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã rút</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wallets.map((wallet) => (
                  <tr key={wallet.walletId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{wallet.supplierName}</div>
                        <div className="text-sm text-gray-500">{wallet.storeName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {walletService.formatVND(wallet.availableBalance)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-yellow-600">
                      {walletService.formatVND(wallet.pendingBalance)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                      {walletService.formatVND(wallet.totalBalance)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {walletService.formatVND(wallet.totalWithdrawn)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${walletService.getStatusColor(wallet.status)}`}>
                        {wallet.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => setSelectedWallet(wallet)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(wallet.walletId, wallet.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                        className={wallet.status === 'ACTIVE' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                      >
                        {wallet.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
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
            <div className="text-sm text-gray-700">Trang {page + 1} / {totalPages}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Detail Modal */}
      {selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Chi tiết ví</h3>
              <button onClick={() => setSelectedWallet(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Thông tin nhà cung cấp</h4>
                <div className="space-y-1">
                  <p><span className="text-gray-600">Tên:</span> <span className="font-semibold">{selectedWallet.supplierName}</span></p>
                  <p><span className="text-gray-600">Cửa hàng:</span> {selectedWallet.storeName}</p>
                  <p><span className="text-gray-600">Mã ví:</span> {selectedWallet.walletId}</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Số dư khả dụng</p>
                <p className="text-xl font-bold text-green-600">{walletService.formatVND(selectedWallet.availableBalance)}</p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Số dư chờ xử lý</p>
                <p className="text-xl font-bold text-yellow-600">{walletService.formatVND(selectedWallet.pendingBalance)}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Tổng số dư</p>
                <p className="text-xl font-bold text-blue-600">{walletService.formatVND(selectedWallet.totalBalance)}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Thu nhập tháng (Ròng)</p>
                <p className="text-xs text-gray-500">(Sau trừ hoa hồng)</p>
                <p className="text-xl font-bold text-purple-600">{walletService.formatVND(selectedWallet.monthlyEarnings)}</p>
              </div>

              <div className="col-span-2 border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng thu nhập (Ròng):</span>
                  <span className="font-semibold">{walletService.formatVND(selectedWallet.totalEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Đã rút:</span>
                  <span className="font-semibold">{walletService.formatVND(selectedWallet.totalWithdrawn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Đã hoàn trả:</span>
                  <span className="font-semibold text-red-600">{walletService.formatVND(selectedWallet.totalRefunded)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hoa hồng Platform:</span>
                  <span className="font-semibold text-blue-600">{selectedWallet.commissionRate}%</span>
                </div>
                <div className="col-span-2 bg-blue-50 p-3 rounded text-xs text-blue-700 mt-2">
                  💡 <strong>Lưu ý:</strong> Tất cả số tiền hiển thị là số ròng sau khi đã trừ {selectedWallet.commissionRate}% hoa hồng cho Platform SaveFood
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${walletService.getStatusColor(selectedWallet.status)}`}>
                    {selectedWallet.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedWallet(null)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Tạo giao dịch thủ công</h3>
              <button onClick={() => setShowTransactionModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTransaction}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier ID *</label>
                  <input
                    type="text"
                    value={transactionForm.supplierId}
                    onChange={(e) => setTransactionForm({ ...transactionForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch *</label>
                  <select
                    value={transactionForm.transactionType}
                    onChange={(e) => setTransactionForm({ ...transactionForm, transactionType: e.target.value as ManualTransactionRequest['transactionType'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="ADJUSTMENT">Điều chỉnh</option>
                    <option value="ADMIN_DEPOSIT">Nạp tiền</option>
                    <option value="ADMIN_DEDUCTION">Trừ tiền</option>
                    <option value="PENALTY_FEE">Phạt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền * (âm để trừ, dương để cộng)</label>
                  <input
                    type="number"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                  <textarea
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Tạo giao dịch
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
