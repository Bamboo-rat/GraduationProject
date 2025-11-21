import { useEffect, useState } from 'react';
import {
  Star,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Users,
  Award,
  TrendingDown,
} from 'lucide-react';
import { reviewService, type ReviewResponse } from '~/service/reviewService';
import storeService from '~/service/storeService';
import { useAuth } from '~/AuthContext';

interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  reviewsWithComment: number;
  reviewsWithReply: number;
  recentReviews: ReviewResponse[];
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

export default function ReviewsAnalysis() {
  const { user } = useAuth();
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (stores.length > 0) {
      loadData();
    }
  }, [timeRange, selectedStoreId, stores]);

  const loadStores = async () => {
    try {
      const storesResponse = await storeService.getMyStores({ page: 0, size: 100 });
      // Filter out any undefined/null stores
      const validStores = (storesResponse.content || []).filter(store => store && store.storeId);
      setStores(validStores);
    } catch (err) {
      console.error('Failed to load stores:', err);
      setStores([]); // Set empty array on error
    }
  };

  const filterByTimeRange = (reviews: ReviewResponse[], range: TimeRange): ReviewResponse[] => {
    const now = new Date();
    const filterDate = new Date();

    switch (range) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        return reviews;
    }

    return reviews.filter(review => new Date(review.createdAt) >= filterDate);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (stores.length === 0) {
        setLoading(false);
        return;
      }

      // Get reviews from all stores or selected store
      let allReviews: ReviewResponse[] = [];
      
      if (selectedStoreId === 'all') {
        // Load reviews from all stores
        const reviewPromises = stores.map(store => 
          reviewService.getStoreReviews(store.storeId, 0, 1000)
        );
        const reviewsResponses = await Promise.all(reviewPromises);
        allReviews = reviewsResponses.flatMap(response => response.content);
      } else {
        // Load reviews from selected store only
        const reviewsResponse = await reviewService.getStoreReviews(selectedStoreId, 0, 1000);
        allReviews = reviewsResponse.content;
      }

      // Filter by time range
      const filteredReviews = filterByTimeRange(allReviews, timeRange);
      
      // Calculate statistics
      const reviews = filteredReviews;
      const totalReviews = reviews.length;
      
      // Rating distribution
      const distribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let sumRating = 0;
      let withComment = 0;
      let withReply = 0;

      reviews.forEach((review: ReviewResponse) => {
        distribution[review.rating] = (distribution[review.rating] || 0) + 1;
        sumRating += review.rating;
        if (review.comment) withComment++;
        if (review.supplierReply) withReply++;
      });

      const averageRating = totalReviews > 0 ? sumRating / totalReviews : 0;

      setStats({
        averageRating,
        totalReviews,
        ratingDistribution: distribution,
        reviewsWithComment: withComment,
        reviewsWithReply: withReply,
        recentReviews: reviews.slice(0, 5),
      });
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRatingPercentage = (rating: number) => {
    if (!stats || stats.totalReviews === 0) return 0;
    return ((stats.ratingDistribution[rating] || 0) / stats.totalReviews) * 100;
  };

  const getReplyRate = () => {
    if (!stats || stats.totalReviews === 0) return 0;
    return (stats.reviewsWithReply / stats.totalReviews) * 100;
  };

  const getCommentRate = () => {
    if (!stats || stats.totalReviews === 0) return 0;
    return (stats.reviewsWithComment / stats.totalReviews) * 100;
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return 'Xuất sắc';
      case 4: return 'Tốt';
      case 3: return 'Trung bình';
      case 2: return 'Kém';
      case 1: return 'Rất kém';
      default: return '';
    }
  };

  const getPerformanceGrade = () => {
    if (!stats) return { label: 'N/A', color: 'text-gray-500', bg: 'bg-gray-100' };
    
    const avgRating = stats.averageRating;
    if (avgRating >= 4.5) return { label: 'Xuất sắc', color: 'text-green-600', bg: 'bg-green-50' };
    if (avgRating >= 4.0) return { label: 'Tốt', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (avgRating >= 3.5) return { label: 'Khá', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (avgRating >= 3.0) return { label: 'Trung bình', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Cần cải thiện', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A4C3A2]"></div>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    const selectedStore = stores.find(s => s.storeId === selectedStoreId);
    const storeName = selectedStoreId === 'all' ? 'tất cả cửa hàng' : selectedStore?.storeName || 'cửa hàng này';
    
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2D2D2D]">Phân tích đánh giá</h1>
            <p className="text-[#6B6B6B] mt-1">Thống kê và phân tích đánh giá từ khách hàng</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cửa hàng
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-4 py-2 border border-[#B7E4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
              >
                <option value="all">Tất cả cửa hàng ({stores.length})</option>
                {stores.map((store) => (
                  <option key={store.storeId} value={store.storeId}>
                    {store.storeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Khoảng thời gian
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'week', label: '7 ngày' },
                  { value: 'month', label: '30 ngày' },
                  { value: 'quarter', label: '3 tháng' },
                  { value: 'year', label: '1 năm' },
                  { value: 'all', label: 'Tất cả' },
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value as TimeRange)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      timeRange === range.value
                        ? 'bg-[#2F855A] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-16 text-center">
          <div className="max-w-md mx-auto">
            <MessageSquare className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Chưa có đánh giá nào</h2>
            <p className="text-gray-500 mb-2">
              {selectedStoreId === 'all' 
                ? `Chưa có đánh giá nào từ khách hàng trong ${timeRange === 'all' ? 'tất cả thời gian' : 
                    timeRange === 'week' ? '7 ngày qua' : 
                    timeRange === 'month' ? '30 ngày qua' : 
                    timeRange === 'quarter' ? '3 tháng qua' : '1 năm qua'}.`
                : `Cửa hàng "${storeName}" chưa có đánh giá nào trong ${timeRange === 'all' ? 'tất cả thời gian' : 
                    timeRange === 'week' ? '7 ngày qua' : 
                    timeRange === 'month' ? '30 ngày qua' : 
                    timeRange === 'quarter' ? '3 tháng qua' : '1 năm qua'}.`
              }
            </p>
            <p className="text-gray-400 text-sm mt-4">
              Đánh giá từ khách hàng sẽ xuất hiện ở đây sau khi họ mua hàng và đánh giá sản phẩm
            </p>
            {selectedStoreId !== 'all' && (
              <button
                onClick={() => setSelectedStoreId('all')}
                className="mt-6 px-6 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors"
              >
                Xem tất cả cửa hàng
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const grade = getPerformanceGrade();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Phân tích đánh giá</h1>
          <p className="text-[#6B6B6B] mt-1">Thống kê và phân tích đánh giá từ khách hàng</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F855A] text-white rounded-xl hover:bg-[#8FB491] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cửa hàng
            </label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-4 py-2 border border-[#B7E4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]"
            >
              <option value="all">Tất cả cửa hàng ({stores.length})</option>
              {stores.map((store) => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Khoảng thời gian
            </label>
            <div className="flex gap-2">
              {[
                { value: 'week', label: '7 ngày' },
                { value: 'month', label: '30 ngày' },
                { value: 'quarter', label: '3 tháng' },
                { value: 'year', label: '1 năm' },
                { value: 'all', label: 'Tất cả' },
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value as TimeRange)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === range.value
                      ? 'bg-[#2F855A] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Performance Card */}
      <div className={`${grade.bg} border-2 border-${grade.color.replace('text-', '')} rounded-2xl p-8`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Đánh giá tổng thể</h2>
            <div className="flex items-baseline gap-4">
              <span className={`text-6xl font-bold ${grade.color}`}>
                {stats.averageRating.toFixed(1)}
              </span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-8 h-8 ${
                      i < Math.round(stats.averageRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className={`text-xl font-semibold ${grade.color} mt-3`}>
              Xếp loại: {grade.label}
            </p>
            <p className="text-gray-600 mt-2">
              Dựa trên {stats.totalReviews} đánh giá từ khách hàng
            </p>
          </div>
          <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-lg">
            <Award className={`w-16 h-16 ${grade.color}`} />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-2">Tổng đánh giá</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
          <p className="text-xs text-gray-500 mt-2">Tất cả thời gian</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-2">Tỷ lệ phản hồi</h3>
          <p className="text-3xl font-bold text-gray-900">{getReplyRate().toFixed(1)}%</p>
          <p className="text-xs text-green-600 mt-2">
            {stats.reviewsWithReply} / {stats.totalReviews} đã trả lời
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-2">Có bình luận</h3>
          <p className="text-3xl font-bold text-gray-900">{getCommentRate().toFixed(1)}%</p>
          <p className="text-xs text-purple-600 mt-2">
            {stats.reviewsWithComment} / {stats.totalReviews} có text
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 font-medium mb-2">Đánh giá 5 sao</h3>
          <p className="text-3xl font-bold text-gray-900">{getRatingPercentage(5).toFixed(0)}%</p>
          <p className="text-xs text-yellow-600 mt-2">
            {stats.ratingDistribution[5]} đánh giá
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#2F855A]" />
            Phân bổ đánh giá
          </h2>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((rating) => {
              const percentage = getRatingPercentage(rating);
              const count = stats.ratingDistribution[rating] || 0;
              
              return (
                <div key={rating} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-gray-500">{getRatingLabel(rating)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{count}</span>
                      <span className="text-gray-500 w-12 text-right">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${
                          rating >= 4 ? 'bg-green-500' : rating === 3 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#2F855A]" />
            Đánh giá gần đây
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {stats.recentReviews.map((review) => (
              <div
                key={review.reviewId}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#A4C3A2] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{review.customerName}</p>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 font-medium mb-1">{review.productName}</p>
                {review.comment && (
                  <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                )}
                {review.supplierReply && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Phản hồi của bạn:</p>
                    <p className="text-sm text-blue-800">{review.supplierReply}</p>
                  </div>
                )}
                {!review.supplierReply && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Chưa phản hồi</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-[#2F855A]" />
            Đánh giá chi tiết
          </h2>
          <div className="space-y-4">
            {stats.averageRating >= 4.5 && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Xuất sắc!</p>
                  <p className="text-sm text-green-700">
                    Khách hàng rất hài lòng với sản phẩm và dịch vụ của bạn.
                  </p>
                </div>
              </div>
            )}
            {getReplyRate() < 50 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Cần cải thiện</p>
                  <p className="text-sm text-yellow-700">
                    Tỷ lệ phản hồi đánh giá còn thấp ({getReplyRate().toFixed(0)}%). Hãy tăng tương tác với khách hàng.
                  </p>
                </div>
              </div>
            )}
            {(stats.ratingDistribution[1] + stats.ratingDistribution[2]) > stats.totalReviews * 0.2 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Chú ý!</p>
                  <p className="text-sm text-red-700">
                    Có {((stats.ratingDistribution[1] + stats.ratingDistribution[2]) / stats.totalReviews * 100).toFixed(0)}% đánh giá thấp (1-2 sao). Cần xem xét và cải thiện chất lượng.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
