import { useState, useEffect } from 'react';
import promotionService, {
  Promotion,
  PromotionStatus,
  PromotionTier,
} from '~/service/promotionService';

export default function PromotionList() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | undefined>('ACTIVE');
  const [tierFilter, setTierFilter] = useState<PromotionTier | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchPromotions();
  }, [page, statusFilter, tierFilter, debouncedSearch]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getAllPromotions(
        page,
        size,
        statusFilter,
        tierFilter,
        undefined,
        debouncedSearch,
        'createdAt',
        'DESC'
      );
      setPromotions(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
      alert(error.message || 'Lỗi khi tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPromotion(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && promotions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Danh sách Khuyến mãi</h1>
        <p className="text-gray-600">Xem và áp dụng mã khuyến mãi cho đơn hàng</p>
        <p className="text-sm text-gray-500 mt-1">Tổng số: {totalElements} khuyến mãi</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tìm theo mã hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={statusFilter || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value === 'all' ? undefined : (value as PromotionStatus));
                setPage(0);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="EXPIRED">Đã hết hạn</option>
              <option value="SCHEDULED">Đã lên lịch</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hạng thành viên</label>
            <select
              value={tierFilter || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setTierFilter(value === 'all' ? undefined : (value as PromotionTier));
                setPage(0);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="TIER_1">Hạng 1</option>
              <option value="TIER_2">Hạng 2</option>
              <option value="TIER_3">Hạng 3</option>
              <option value="TIER_4">Hạng 4</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            {debouncedSearch || statusFilter !== 'ACTIVE' || tierFilter
              ? 'Không tìm thấy khuyến mãi nào phù hợp'
              : 'Chưa có khuyến mãi nào'}
          </div>
        ) : (
          promotions.map((promotion) => (
            <div
              key={promotion.promotionId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4 border-green-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{promotion.code}</h3>
                    {promotion.isHighlighted && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Nổi bật
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${promotionService.getStatusColorClass(
                      promotion.status
                    )}`}
                  >
                    {promotionService.getStatusLabel(promotion.status)}
                  </span>
                </div>
              </div>

              {promotion.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{promotion.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Giảm giá:</span>
                  <span className="font-bold text-green-600">
                    {promotionService.formatDiscountValue(promotion)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Loại:</span>
                  <span className="text-gray-900">{promotionService.getTypeLabel(promotion.type)}</span>
                </div>
                {promotion.minOrderAmount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Đơn tối thiểu:</span>
                    <span className="text-gray-900">
                      {promotion.minOrderAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sử dụng:</span>
                  <span className="text-gray-900">
                    {promotion.usageCount}/{promotion.usageLimit || '∞'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Hạng:</span>
                  <span className="text-gray-900">{promotionService.getTierLabel(promotion.tier)}</span>
                </div>
              </div>

              <div className="border-t pt-3 mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Từ: {formatDate(promotion.startDate)}</span>
                  <span>Đến: {formatDate(promotion.endDate)}</span>
                </div>
              </div>

              <button
                onClick={() => openDetailModal(promotion)}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Xem chi tiết
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Trang {page + 1} / {totalPages} - Tổng {totalElements} khuyến mãi
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPromotion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Chi tiết Khuyến mãi</h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {selectedPromotion.code}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {promotionService.formatDiscountValue(selectedPromotion)}
                    </div>
                  </div>
                </div>

                {selectedPromotion.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Mô tả</label>
                    <p className="text-gray-900">{selectedPromotion.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Loại giảm giá</label>
                    <p className="text-gray-900">{promotionService.getTypeLabel(selectedPromotion.type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Trạng thái</label>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${promotionService.getStatusColorClass(
                        selectedPromotion.status
                      )}`}
                    >
                      {promotionService.getStatusLabel(selectedPromotion.status)}
                    </span>
                  </div>
                  {selectedPromotion.minOrderAmount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Đơn tối thiểu</label>
                      <p className="text-gray-900">
                        {selectedPromotion.minOrderAmount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  )}
                  {selectedPromotion.maxDiscountAmount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Giảm tối đa</label>
                      <p className="text-gray-900">
                        {selectedPromotion.maxDiscountAmount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ngày bắt đầu</label>
                    <p className="text-gray-900">{formatDate(selectedPromotion.startDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ngày kết thúc</label>
                    <p className="text-gray-900">{formatDate(selectedPromotion.endDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Số lần sử dụng</label>
                    <p className="text-gray-900">
                      {selectedPromotion.usageCount} / {selectedPromotion.usageLimit || 'Không giới hạn'}
                    </p>
                  </div>
                  {selectedPromotion.perUserLimit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Giới hạn/người</label>
                      <p className="text-gray-900">{selectedPromotion.perUserLimit}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Hạng áp dụng</label>
                    <p className="text-gray-900">{promotionService.getTierLabel(selectedPromotion.tier)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nổi bật</label>
                    <p className="text-gray-900">{selectedPromotion.isHighlighted ? 'Có' : 'Không'}</p>
                  </div>
                </div>

                {selectedPromotion.applicableCategories && selectedPromotion.applicableCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Danh mục áp dụng ({selectedPromotion.applicableCategories.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedPromotion.applicableCategories.map((categoryId) => (
                        <span
                          key={categoryId}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                        >
                          {categoryId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Đang có hiệu lực</p>
                    <p
                      className={`font-medium ${
                        promotionService.isPromotionValid(selectedPromotion)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {promotionService.isPromotionValid(selectedPromotion) ? 'Có thể sử dụng' : 'Không thể sử dụng'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeDetailModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
