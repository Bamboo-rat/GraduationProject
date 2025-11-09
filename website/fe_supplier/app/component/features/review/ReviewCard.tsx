import { useState } from 'react';
import { MessageSquare, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import type { ReviewResponse } from '~/service/reviewService';

interface ReviewCardProps {
  review: ReviewResponse;
  onReply: () => void;
  onEditReply: () => void;
  onDeleteReply: () => void;
}

export default function ReviewCard({ review, onReply, onEditReply, onDeleteReply }: ReviewCardProps) {
  const [showImage, setShowImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRemainingEditDays = () => {
    if (!review.repliedAt) return 0;
    const repliedDate = new Date(review.repliedAt);
    const deadline = new Date(repliedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const remainingMs = deadline.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return Math.max(0, remainingDays);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDeleteReply();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Customer Review */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {review.customerName.charAt(0).toUpperCase()}
        </div>

        {/* Review Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-semibold text-gray-800">{review.customerName}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
              </div>
            </div>
            {review.orderCode && (
              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                #{review.orderCode}
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
            {review.productImage && (
              <img
                src={review.productImage}
                alt={review.productName}
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <div className="font-medium text-gray-800 text-sm">{review.productName}</div>
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-gray-700 mt-3 leading-relaxed">{review.comment}</p>
          )}

          {/* Review Image */}
          {review.imageUrl && (
            <div className="mt-3">
              <img
                src={review.imageUrl}
                alt="Review"
                className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImage(true)}
              />
            </div>
          )}

          {/* Supplier Reply */}
          {review.supplierReply ? (
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-600" />
                  <span className="font-medium text-gray-800">Phản hồi của bạn</span>
                </div>
                {review.repliedAt && (
                  <span className="text-xs text-gray-500">{formatDate(review.repliedAt)}</span>
                )}
              </div>
              <p className="text-gray-700 mt-2">{review.supplierReply}</p>
              
              {/* Edit/Delete Actions */}
              <div className="flex items-center gap-3 mt-3">
                {review.canEditReply && (
                  <>
                    <button
                      onClick={onEditReply}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Edit2 size={14} />
                      Sửa
                    </button>
                    <span className="text-xs text-gray-400">
                      (còn {getRemainingEditDays()} ngày)
                    </span>
                  </>
                )}
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={14} />
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <button
                onClick={onReply}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare size={16} />
                Trả lời
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImage && review.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setShowImage(false)}
        >
          <img
            src={review.imageUrl}
            alt="Review"
            className="max-w-4xl max-h-[90vh] object-contain"
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Xác nhận xóa phản hồi</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa phản hồi này? Sau khi xóa, bạn có thể tạo phản hồi mới.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
