import { useState, useEffect } from 'react';
import { Star, Search, Filter, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react';
import { reviewService, type ReviewResponse } from '~/service/reviewService';
import { storeService } from '~/service/storeService';
import ReviewCard from '~/component/features/review/ReviewCard';
import ReplyModal from '~/component/features/review/ReplyModal';

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storeId, setStoreId] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  
  // Filters
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewResponse | null>(null);
  const [isEditingReply, setIsEditingReply] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    withReply: 0,
    pendingReply: 0,
  });

  // Fetch store info
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const stores = await storeService.getStoreBySupplier();
        if (stores.length > 0) {
          setStoreId(stores[0].storeId);
        } else {
          setError('Bạn chưa có cửa hàng nào');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch store:', err);
        setError('Không thể tải thông tin cửa hàng');
        setLoading(false);
      }
    };
    fetchStoreInfo();
  }, []);

  // Fetch reviews
  useEffect(() => {
    if (!storeId) return;
    fetchReviews();
  }, [storeId, currentPage, selectedRating]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reviewService.getStoreReviews(storeId, currentPage, 10);
      
      let filteredReviews = response.content;
      if (selectedRating !== null) {
        filteredReviews = filteredReviews.filter(r => r.rating === selectedRating);
      }

      setReviews(filteredReviews);
      setTotalPages(response.totalPages);
      setTotalReviews(response.totalElements);

      // Calculate statistics
      const withReply = filteredReviews.filter(r => r.supplierReply).length;
      const avgRating = filteredReviews.length > 0
        ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length
        : 0;

      setStats({
        totalReviews: response.totalElements,
        averageRating: Math.round(avgRating * 10) / 10,
        withReply,
        pendingReply: filteredReviews.length - withReply,
      });
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (review: ReviewResponse) => {
    setSelectedReview(review);
    setIsEditingReply(false);
    setReplyModalOpen(true);
  };

  const handleEditReply = (review: ReviewResponse) => {
    setSelectedReview(review);
    setIsEditingReply(true);
    setReplyModalOpen(true);
  };

  const handleSubmitReply = async (reply: string) => {
    if (!selectedReview) return;

    try {
      if (isEditingReply) {
        await reviewService.updateReply(selectedReview.reviewId, reply);
      } else {
        await reviewService.replyToReview(selectedReview.reviewId, reply);
      }
      
      // Refresh reviews
      await fetchReviews();
      setReplyModalOpen(false);
      setSelectedReview(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    try {
      await reviewService.deleteReply(reviewId);
      await fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa phản hồi');
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRatingFilter = (rating: number | null) => {
    setSelectedRating(rating);
    setCurrentPage(0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Đánh giá & Nhận xét</h1>
        <p className="text-gray-600 mt-1">Quản lý và phản hồi đánh giá từ khách hàng</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng đánh giá</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalReviews}</p>
            </div>
            <MessageSquare className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đánh giá TB</p>
              <p className="text-2xl font-bold text-gray-800 mt-1 flex items-center gap-1">
                {stats.averageRating}
                <Star size={20} className="text-yellow-400 fill-current" />
              </p>
            </div>
            <TrendingUp className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Đã phản hồi</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.withReply}</p>
            </div>
            <MessageSquare className="text-green-500 fill-current" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chờ phản hồi</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pendingReply}</p>
            </div>
            <AlertCircle className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <span className="font-medium text-gray-800">Lọc theo đánh giá:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleRatingFilter(null)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              selectedRating === null
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tất cả
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingFilter(rating)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-1 ${
                selectedRating === rating
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {rating}
              <Star size={16} className="text-yellow-400 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Đang tải đánh giá...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="mx-auto mb-2" size={48} />
            <p>{error}</p>
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MessageSquare className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg">Chưa có đánh giá nào</p>
          <p className="text-gray-500 text-sm mt-2">
            {selectedRating !== null
              ? `Không có đánh giá ${selectedRating} sao`
              : 'Đánh giá từ khách hàng sẽ hiển thị ở đây'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.reviewId}
                review={review}
                onReply={() => handleReply(review)}
                onEditReply={() => handleEditReply(review)}
                onDeleteReply={() => handleDeleteReply(review.reviewId)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      currentPage === index
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Reply Modal */}
      {selectedReview && (
        <ReplyModal
          isOpen={replyModalOpen}
          onClose={() => {
            setReplyModalOpen(false);
            setSelectedReview(null);
          }}
          onSubmit={handleSubmitReply}
          existingReply={isEditingReply ? selectedReview.supplierReply : undefined}
          reviewContent={{
            customerName: selectedReview.customerName,
            rating: selectedReview.rating,
            comment: selectedReview.comment,
          }}
        />
      )}
    </div>
  );
}
