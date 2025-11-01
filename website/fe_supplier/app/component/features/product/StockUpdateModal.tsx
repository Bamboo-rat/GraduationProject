import { useState } from 'react';
import { X } from 'lucide-react';

interface StockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStock: number, note?: string) => Promise<void>;
  storeName: string;
  variantName: string;
  currentStock: number;
}

export default function StockUpdateModal({
  isOpen,
  onClose,
  onConfirm,
  storeName,
  variantName,
  currentStock,
}: StockUpdateModalProps) {
  const [newStock, setNewStock] = useState(currentStock.toString());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const stockNumber = parseInt(newStock);
    if (isNaN(stockNumber) || stockNumber < 0) {
      setError('Số lượng tồn kho phải là số không âm');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(stockNumber, note || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật tồn kho');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNewStock(currentStock.toString());
      setNote('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Cập nhật tồn kho</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Biến thể:</div>
            <div className="font-medium mb-2">{variantName}</div>
            <div className="text-sm text-gray-600 mb-1">Cửa hàng:</div>
            <div className="font-medium mb-2">{storeName}</div>
            <div className="text-sm text-gray-600 mb-1">Tồn kho hiện tại:</div>
            <div className="font-semibold text-blue-600">{currentStock} sản phẩm</div>
          </div>

          {/* New Stock Input */}
          <div className="mb-4">
            <label htmlFor="newStock" className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng mới <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="newStock"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Nhập số lượng tồn kho mới"
              required
            />
          </div>

          {/* Note Input */}
          <div className="mb-4">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Vd: Nhập hàng mới từ nhà cung cấp"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Change Preview */}
          {newStock !== currentStock.toString() && !isNaN(parseInt(newStock)) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Thay đổi:</span>{' '}
                <span className={currentStock < parseInt(newStock) ? 'text-green-600' : 'text-red-600'}>
                  {currentStock} → {newStock}
                </span>
                {' '}({parseInt(newStock) - currentStock > 0 ? '+' : ''}{parseInt(newStock) - currentStock})
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || newStock === currentStock.toString()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
