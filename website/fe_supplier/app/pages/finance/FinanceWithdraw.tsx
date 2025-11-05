import { useEffect, useState } from 'react';
import walletService from '~/service/walletService';
import type { WalletResponse, WithdrawalRequest } from '~/service/walletService';

export default function FinanceWithdraw() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<WithdrawalRequest>({
    amount: 0,
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    note: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet) return;

    // Validation
    if (formData.amount < 50000) {
      setError('Số tiền rút tối thiểu là 50,000đ');
      return;
    }

    if (formData.amount > wallet.availableBalance) {
      setError('Số tiền rút vượt quá số dư khả dụng');
      return;
    }

    if (!formData.bankName || !formData.bankAccountNumber || !formData.bankAccountName) {
      setError('Vui lòng điền đầy đủ thông tin ngân hàng');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const result = await walletService.requestWithdrawal(formData);
      setSuccess(`Yêu cầu rút tiền ${walletService.formatVND(result.amount)} đã được gửi thành công!`);
      
      // Reset form
      setFormData({
        amount: 0,
        bankName: '',
        bankAccountNumber: '',
        bankAccountName: '',
        note: '',
      });
      
      // Reload wallet
      await loadWallet();
    } catch (err: any) {
      setError(err.message || 'Không thể thực hiện yêu cầu rút tiền');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Rút tiền</h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-600">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Số dư ví</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Số dư khả dụng</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {walletService.formatVND(wallet?.availableBalance || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số dư chờ xử lý</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {walletService.formatVND(wallet?.pendingBalance || 0)}
                </p>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-gray-500">Tổng số dư</p>
                <p className="text-xl font-bold text-blue-600">
                  {walletService.formatVND(wallet?.totalBalance || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Lưu ý:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Số tiền rút tối thiểu: 50,000đ</li>
              <li>• Chỉ rút từ số dư khả dụng</li>
              <li>• Thời gian xử lý: 1-3 ngày làm việc</li>
              <li>• Kiểm tra kỹ thông tin ngân hàng</li>
            </ul>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin rút tiền</h3>
            
            {wallet?.status !== 'ACTIVE' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                Ví của bạn đang bị khóa. Vui lòng liên hệ hỗ trợ.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tiền rút <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập số tiền"
                        min="50000"
                        max={wallet?.availableBalance || 0}
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">đ</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Tối đa: {walletService.formatVND(wallet?.availableBalance || 0)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên ngân hàng <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Chọn ngân hàng</option>
                        <option value="Vietcombank">Vietcombank</option>
                        <option value="VietinBank">VietinBank</option>
                        <option value="BIDV">BIDV</option>
                        <option value="Agribank">Agribank</option>
                        <option value="Techcombank">Techcombank</option>
                        <option value="MB Bank">MB Bank</option>
                        <option value="ACB">ACB</option>
                        <option value="VPBank">VPBank</option>
                        <option value="TPBank">TPBank</option>
                        <option value="Sacombank">Sacombank</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tài khoản <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccountNumber}
                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập số tài khoản"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên chủ tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountName}
                      onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tên chủ tài khoản"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập ghi chú (nếu có)"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {submitting ? 'Đang xử lý...' : 'Yêu cầu rút tiền'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          amount: 0,
                          bankName: '',
                          bankAccountNumber: '',
                          bankAccountName: '',
                          note: '',
                        });
                        setError(null);
                        setSuccess(null);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Xóa form
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
