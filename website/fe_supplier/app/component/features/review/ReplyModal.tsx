import { useState } from 'react';
import { X } from 'lucide-react';

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reply: string) => Promise<void>;
  existingReply?: string;
  reviewContent: {
    customerName: string;
    rating: number;
    comment?: string;
  };
}

export default function ReplyModal({
  isOpen,
  onClose,
  onSubmit,
  existingReply,
  reviewContent,
}: ReplyModalProps) {
  const [reply, setReply] = useState(existingReply || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!existingReply;
  const remainingChars = 1000 - reply.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reply.trim()) {
      setError('Vui lòng nhập nội dung phản hồi');
      return;
    }

    if (reply.length > 1000) {
      setError('Nội dung phản hồi không được vượt quá 1000 ký tự');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(reply);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="
fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Sửa phản hồi' : 'Trả lời đánh giá'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* Reply Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phản hồi của bạn <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
              placeholder="Nhập phản hồi của bạn cho khách hàng..."
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className={`text-sm ${remainingChars < 100 ? 'text-red-500' : 'text-gray-500'}`}>
                Còn lại: {remainingChars} ký tự
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading || !reply.trim()}
            >
              {loading ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Gửi phản hồi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
