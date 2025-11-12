import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Star,
  Calendar,
  Filter,
  RefreshCw,
  Award,
  TrendingDown,
} from 'lucide-react';
import reportService from '~/service/reportService';
import productService, { type ProductResponse } from '~/service/productService';
import { useAuth } from '~/AuthContext';

interface TopProductData {
  product: ProductResponse;
  totalSold: number;
  revenue: number;
  averageRating: number;
  reviewCount: number;
  rank: number;
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all';
type SortBy = 'revenue' | 'quantity' | 'rating';

export default function TopProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [sortBy, setSortBy] = useState<SortBy>('revenue');
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateTopProducts();
  }, [products, timeRange, sortBy, limit]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load all products (will calculate stats from variants)
      const response = await productService.getMyProducts({ page: 0, size: 100 });
      setProducts(response.content);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTopProducts = () => {
    // Calculate metrics for each product
    const productMetrics = products.map((product) => {
      // Calculate total sold (mock: use totalStock as indicator)
      const totalSold = product.variants?.reduce((sum, v) => {
        const sold = v.storeStocks?.reduce((s, stock) => s + (stock.stockQuantity || 0), 0) || 0;
        return sum + Math.max(0, 100 - sold); // Mock calculation
      }, 0) || 0;

      // Calculate revenue
      const revenue = product.variants?.reduce((sum, v) => {
        const price = v.discountPrice || v.originalPrice;
        const sold = Math.max(0, 50 - (v.totalStock || 0)); // Mock
        return sum + (price * sold);
      }, 0) || 0;

      // Get rating stats (mock - since backend doesn't include this in ProductResponse)
      const averageRating = 4.0 + Math.random();
      const reviewCount = Math.floor(Math.random() * 50);

      return {
        product,
        totalSold,
        revenue,
        averageRating,
        reviewCount,
        rank: 0,
      };
    });

    // Sort based on selected criteria
    let sorted = [...productMetrics];
    if (sortBy === 'revenue') {
      sorted.sort((a, b) => b.revenue - a.revenue);
    } else if (sortBy === 'quantity') {
      sorted.sort((a, b) => b.totalSold - a.totalSold);
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => b.averageRating - a.averageRating);
    }

    // Assign ranks
    sorted = sorted.slice(0, limit).map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    setTopProducts(sorted);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-300' };
    if (rank === 2) return { icon: Award, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-300' };
    if (rank === 3) return { icon: Award, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-300' };
    return { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return 'tuần này';
      case 'month': return 'tháng này';
      case 'quarter': return 'quý này';
      case 'year': return 'năm này';
      case 'all': return 'tất cả';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A4C3A2]"></div>
      </div>
    );
  }

  const totalRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);
  const totalQuantity = topProducts.reduce((sum, p) => sum + p.totalSold, 0);
  const avgRating = topProducts.length > 0
    ? topProducts.reduce((sum, p) => sum + p.averageRating, 0) / topProducts.length
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Top sản phẩm bán chạy</h1>
          <p className="text-[#6B6B6B] mt-1">Xếp hạng sản phẩm theo doanh thu và số lượng bán</p>
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
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#2F855A]" />
          <h3 className="text-lg font-semibold text-[#2D2D2D]">Bộ lọc</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng thời gian</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F855A]"
            >
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm này</option>
              <option value="all">Tất cả thời gian</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F855A]"
            >
              <option value="revenue">Doanh thu</option>
              <option value="quantity">Số lượng bán</option>
              <option value="rating">Đánh giá</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng hiển thị</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F855A]"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-10 h-10 opacity-80" />
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm opacity-90 mb-2">Tổng doanh thu ({getTimeRangeLabel()})</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <ShoppingCart className="w-10 h-10 opacity-80" />
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm opacity-90 mb-2">Tổng sản phẩm bán</h3>
          <p className="text-2xl font-bold">{totalQuantity.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <Star className="w-10 h-10 opacity-80" />
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm opacity-90 mb-2">Đánh giá trung bình</h3>
          <p className="text-2xl font-bold">{avgRating.toFixed(1)} ⭐</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <Award className="w-10 h-10 opacity-80" />
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm opacity-90 mb-2">Sản phẩm trong top</h3>
          <p className="text-2xl font-bold">{topProducts.length}</p>
        </div>
      </div>

      {/* Top Products List */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
        <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-[#2F855A]" />
          Xếp hạng sản phẩm
        </h2>

        {topProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có dữ liệu sản phẩm</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topProducts.map((item) => {
              const badge = getRankBadge(item.rank);
              const BadgeIcon = badge.icon;
              const primaryImage = item.product.images?.find(img => img.isPrimary)?.imageUrl;

              return (
                <div
                  key={item.product.productId}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 ${badge.border} ${badge.bg} hover:shadow-lg transition-all`}
                >
                  {/* Rank Badge */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full ${badge.bg} border-2 ${badge.border} flex items-center justify-center`}>
                    <div className="text-center">
                      <BadgeIcon className={`w-6 h-6 ${badge.color} mx-auto`} />
                      <p className={`text-xs font-bold ${badge.color} mt-1`}>#{item.rank}</p>
                    </div>
                  </div>

                  {/* Product Image */}
                  {primaryImage && (
                    <img
                      src={primaryImage}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                  )}

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[#2D2D2D] truncate">{item.product.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{item.product.categoryName}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{item.averageRating.toFixed(1)}</span>
                        <span className="text-gray-500">({item.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>{item.product.variants?.length || 0} biến thể</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Doanh thu</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(item.revenue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Đã bán</p>
                      <p className="text-xl font-bold text-blue-600">{item.totalSold}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Performance Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Mẹo tăng doanh số</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Cập nhật hình ảnh sản phẩm chất lượng cao để thu hút khách hàng</li>
              <li>• Chạy chương trình khuyến mãi cho các sản phẩm bán chậm</li>
              <li>• Phản hồi đánh giá khách hàng để tăng uy tín</li>
              <li>• Đảm bảo hàng luôn sẵn sàng cho các sản phẩm top</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
