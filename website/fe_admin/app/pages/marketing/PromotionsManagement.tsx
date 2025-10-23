import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import promotionService, {
  Promotion,
  PromotionRequest,
  PromotionStatus,
  PromotionTier,
  PromotionType,
} from '~/service/promotionService';
import categoryService, { Category } from '~/service/categoryService';

export default function PromotionsManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | undefined>(undefined);
  const [tierFilter, setTierFilter] = useState<PromotionTier | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  // Form state
  const [formData, setFormData] = useState<PromotionRequest>({
    code: '',
    description: '',
    type: 'PERCENTAGE',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    startDate: '',
    endDate: '',
    usageLimit: undefined,
    perUserLimit: 1,
    tier: 'TIER_1',
    status: 'ACTIVE',
    isHighlighted: false,
    applicableCategories: [],
  });

  useEffect(() => {
    fetchPromotions();
    fetchCategories();
  }, [page, statusFilter, tierFilter, searchQuery]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await promotionService.getAllPromotions(
        page,
        size,
        statusFilter,
        tierFilter,
        undefined,
        searchQuery,
        'createdAt',
        'DESC'
      );
      setPromotions(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const activeCategories = await categoryService.getActiveCategories();
      setCategories(activeCategories);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      if (editingPromotion) {
        await promotionService.updatePromotion(editingPromotion.promotionId, formData);
        setSuccess('Cập nhật khuyến mãi thành công');
      } else {
        await promotionService.createPromotion(formData);
        setSuccess('Tạo khuyến mãi thành công');
      }
      setShowModal(false);
      resetForm();
      fetchPromotions();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description || '',
      type: promotion.type,
      discountValue: promotion.discountValue,
      minOrderAmount: promotion.minOrderAmount || 0,
      maxDiscountAmount: promotion.maxDiscountAmount || 0,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      usageLimit: promotion.usageLimit,
      perUserLimit: promotion.perUserLimit || 1,
      tier: promotion.tier,
      status: promotion.status,
      isHighlighted: promotion.isHighlighted,
      applicableCategories: promotion.applicableCategories || [],
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!promotionToDelete) return;

    try {
      setLoading(true);
      setError(null);
      await promotionService.deletePromotion(promotionToDelete.promotionId);
      setSuccess('Xóa khuyến mãi thành công');
      setShowDeleteModal(false);
      setPromotionToDelete(null);
      fetchPromotions();
    } catch (err: any) {
      setError(err.message || 'Không thể xóa khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (promotion: Promotion, newStatus: PromotionStatus) => {
    try {
      setLoading(true);
      setError(null);
      await promotionService.toggleStatus(promotion.promotionId, newStatus);
      setSuccess(`Cập nhật trạng thái khuyến mãi thành công`);
      fetchPromotions();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'PERCENTAGE',
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      startDate: '',
      endDate: '',
      usageLimit: undefined,
      perUserLimit: 1,
      tier: 'TIER_1',
      status: 'ACTIVE',
      isHighlighted: false,
      applicableCategories: [],
    });
    setEditingPromotion(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openDeleteModal = (promotion: Promotion) => {
    setPromotionToDelete(promotion);
    setShowDeleteModal(true);
  };

  const openDetailModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setShowDetailModal(true);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = formData.applicableCategories || [];
    if (currentCategories.includes(categoryId)) {
      setFormData({
        ...formData,
        applicableCategories: currentCategories.filter((id) => id !== categoryId),
      });
    } else {
      setFormData({
        ...formData,
        applicableCategories: [...currentCategories, categoryId],
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Khuyến mãi</h1>
            <p className="text-gray-600 mt-1">Tổng số: {totalElements} khuyến mãi</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Tạo khuyến mãi mới
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Tìm theo mã hoặc mô tả..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Không hoạt động</option>
                <option value="EXPIRED">Đã hết hạn</option>
                <option value="SCHEDULED">Đã lên lịch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hạng</label>
              <select
                value={tierFilter || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setTierFilter(value === 'all' ? undefined : (value as PromotionTier));
                  setPage(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Promotions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading && !promotions.length ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Không có khuyến mãi nào</div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá trị
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sử dụng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hạng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promotions.map((promotion) => (
                    <tr key={promotion.promotionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {promotion.code}
                            {promotion.isHighlighted && (
                              <span className="ml-2 text-yellow-500">⭐</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {promotionService.getTypeLabel(promotion.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          {promotionService.formatDiscountValue(promotion)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {promotion.usageCount}
                          {promotion.usageLimit ? `/${promotion.usageLimit}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {promotionService.getTierLabel(promotion.tier)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${promotionService.getStatusColorClass(
                            promotion.status
                          )}`}
                        >
                          {promotionService.getStatusLabel(promotion.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openDetailModal(promotion)}
                          className="text-gray-600 hover:text-gray-900 mr-3"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(
                              promotion,
                              promotion.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                            )
                          }
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                        >
                          {promotion.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        </button>
                        <button
                          onClick={() => openDeleteModal(promotion)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Hiển thị <span className="font-medium">{page * size + 1}</span> đến{' '}
                        <span className="font-medium">
                          {Math.min((page + 1) * size, totalElements)}
                        </span>{' '}
                        trong tổng số <span className="font-medium">{totalElements}</span> khuyến mãi
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage(page - 1)}
                          disabled={page === 0}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Trước
                        </button>
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          let pageNumber = i;
                          if (totalPages > 5) {
                            if (page < 3) pageNumber = i;
                            else if (page > totalPages - 4) pageNumber = totalPages - 5 + i;
                            else pageNumber = page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setPage(pageNumber)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNumber === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber + 1}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={page >= totalPages - 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã khuyến mãi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value.toUpperCase() })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="VD: SUMMER2024"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại khuyến mãi <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value as PromotionType })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="PERCENTAGE">Giảm theo phần trăm</option>
                        <option value="FIXED_AMOUNT">Giảm theo số tiền</option>
                        <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mô tả về khuyến mãi"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá trị giảm <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({ ...formData, discountValue: Number(e.target.value) })
                        }
                        required
                        min="0"
                        step={formData.type === 'PERCENTAGE' ? '1' : '1000'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={formData.type === 'PERCENTAGE' ? '10' : '50000'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.type === 'PERCENTAGE'
                          ? 'Nhập % giảm (0-100)'
                          : 'Nhập số tiền giảm'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá trị đơn tối thiểu
                      </label>
                      <input
                        type="number"
                        value={formData.minOrderAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, minOrderAmount: Number(e.target.value) })
                        }
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giảm tối đa
                      </label>
                      <input
                        type="number"
                        value={formData.maxDiscountAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })
                        }
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hạng khách hàng <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.tier}
                        onChange={(e) =>
                          setFormData({ ...formData, tier: e.target.value as PromotionTier })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="TIER_1">Hạng 1</option>
                        <option value="TIER_2">Hạng 2</option>
                        <option value="TIER_3">Hạng 3</option>
                        <option value="TIER_4">Hạng 4</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày bắt đầu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày kết thúc <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng sử dụng tối đa
                      </label>
                      <input
                        type="number"
                        value={formData.usageLimit || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            usageLimit: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Không giới hạn"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lần dùng/người
                      </label>
                      <input
                        type="number"
                        value={formData.perUserLimit}
                        onChange={(e) =>
                          setFormData({ ...formData, perUserLimit: Number(e.target.value) })
                        }
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as PromotionStatus })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="INACTIVE">Không hoạt động</option>
                      <option value="SCHEDULED">Đã lên lịch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Danh mục áp dụng (để trống = tất cả)
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {categories.map((category) => (
                        <div key={category.categoryId} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`category-${category.categoryId}`}
                            checked={formData.applicableCategories?.includes(
                              category.categoryId
                            )}
                            onChange={() => handleCategoryToggle(category.categoryId)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`category-${category.categoryId}`}
                            className="ml-2 block text-sm text-gray-900"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isHighlighted"
                      checked={formData.isHighlighted}
                      onChange={(e) =>
                        setFormData({ ...formData, isHighlighted: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isHighlighted" className="ml-2 block text-sm text-gray-900">
                      Nổi bật (hiển thị ở trang chủ)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Đang xử lý...' : editingPromotion ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedPromotion && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Chi tiết khuyến mãi
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Mã:</span>
                    <span className="text-sm text-gray-900 font-bold">
                      {selectedPromotion.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Loại:</span>
                    <span className="text-sm text-gray-900">
                      {promotionService.getTypeLabel(selectedPromotion.type)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Giá trị:</span>
                    <span className="text-sm text-green-600 font-bold">
                      {promotionService.formatDiscountValue(selectedPromotion)}
                    </span>
                  </div>
                  {selectedPromotion.minOrderAmount && selectedPromotion.minOrderAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Đơn hàng tối thiểu:
                      </span>
                      <span className="text-sm text-gray-900">
                        {selectedPromotion.minOrderAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                  {selectedPromotion.maxDiscountAmount && selectedPromotion.maxDiscountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Giảm tối đa:</span>
                      <span className="text-sm text-gray-900">
                        {selectedPromotion.maxDiscountAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Thời gian:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedPromotion.startDate).toLocaleString('vi-VN')} -{' '}
                      {new Date(selectedPromotion.endDate).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Đã sử dụng:</span>
                    <span className="text-sm text-gray-900">
                      {selectedPromotion.usageCount}
                      {selectedPromotion.usageLimit ? `/${selectedPromotion.usageLimit}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Hạng:</span>
                    <span className="text-sm text-gray-900">
                      {promotionService.getTierLabel(selectedPromotion.tier)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
                    <span
                      className={`text-sm px-2 py-1 rounded ${promotionService.getStatusColorClass(
                        selectedPromotion.status
                      )}`}
                    >
                      {promotionService.getStatusLabel(selectedPromotion.status)}
                    </span>
                  </div>
                  {selectedPromotion.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedPromotion.description}
                      </p>
                    </div>
                  )}
                  {selectedPromotion.applicableCategories &&
                    selectedPromotion.applicableCategories.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Danh mục áp dụng:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedPromotion.applicableCategories.map((catId) => {
                            const category = categories.find((c) => c.categoryId === catId);
                            return category ? (
                              <span
                                key={catId}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                              >
                                {category.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && promotionToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Xác nhận xóa</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa khuyến mãi "
                    <strong>{promotionToDelete.code}</strong>"?
                    <br />
                    Hành động này không thể hoàn tác.
                  </p>
                </div>
                <div className="flex justify-center space-x-3 px-4 py-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setPromotionToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
