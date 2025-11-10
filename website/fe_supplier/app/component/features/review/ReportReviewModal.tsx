import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  reviewContent: {
    customerName: string;
    rating: number;
    comment?: string;
  };
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam/Quảng cáo' },
  { value: 'OFFENSIVE', label: 'Nội dung xúc phạm/thô tục' },
  { value: 'FAKE', label: 'Đánh giá giả mạo' },
  { value: 'IRRELEVANT', label: 'Không liên quan đến sản phẩm' },
  { value: 'OTHER', label: 'Khác' },
];

export default function ReportReviewModal({
  isOpen,
  onClose,
  onSubmit,
  reviewContent,
}: ReportReviewModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Vui lòng chọn lý do báo cáo');
      return;
    }

    if (selectedReason === 'OTHER' && !customReason.trim()) {
      setError('Vui lòng nhập lý do cụ thể');
      return;
    }

    const finalReason = selectedReason === 'OTHER' 
      ? customReason.trim()
      : REPORT_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

    try {
      setLoading(true);
      setError('');
      await onSubmit(finalReason);
      // Reset form
      setSelectedReason('');
      setCustomReason('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedReason('');
      setCustomReason('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">
              Báo cáo đánh giá vi phạm
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Review Content */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {reviewContent.customerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">{reviewContent.customerName}</div>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < reviewContent.rating ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
              </div>
              {reviewContent.comment && (
                <p className="text-gray-600 mt-2">{reviewContent.comment}</p>
              )}
            </div>
          </div>
        </div>

        {/* Report Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Lý do báo cáo <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <span className="text-gray-800">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'OTHER' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Vui lòng mô tả chi tiết lý do báo cáo..."
                maxLength={500}
              />
              <div className="text-sm text-gray-500 mt-2">
                {customReason.length}/500 ký tự
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Lưu ý:</strong> Đánh giá này sẽ được đánh dấu vi phạm và ẩn khỏi hiển thị ngay lập tức. 
              Việc báo cáo sai hoặc lạm dụng có thể ảnh hưởng đến tài khoản của bạn.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading || !selectedReason || (selectedReason === 'OTHER' && !customReason.trim())}
            >
              {loading ? 'Đang xử lý...' : 'Đánh dấu vi phạm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
