import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import promotionService from '~/service/promotionService';
import type {
  Promotion,
  PromotionRequest,
  PromotionStatus,
  PromotionTier,
  PromotionType,
} from '~/service/promotionService';
import { PlusCircle, Search, Filter, Eye, Edit2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

export default function PromotionsManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
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
    title: '',
    description: '',
    type: 'PERCENTAGE',
    tier: 'GENERAL',
    discountValue: 0,
    minimumOrderAmount: 0,
    maxDiscountAmount: 0,
    startDate: '',
    endDate: '',
    totalUsageLimit: undefined,
    usagePerCustomerLimit: 1,
    status: 'ACTIVE',
    isHighlighted: false,
  });

  useEffect(() => {
    fetchPromotions();
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
      title: promotion.title,
      description: promotion.description || '',
      type: promotion.type,
      tier: promotion.tier,
      discountValue: promotion.discountValue,
      minimumOrderAmount: promotion.minimumOrderAmount || 0,
      maxDiscountAmount: promotion.maxDiscountAmount || 0,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      totalUsageLimit: promotion.totalUsageLimit,
      usagePerCustomerLimit: promotion.usagePerCustomerLimit || 1,
      status: promotion.status,
      isHighlighted: promotion.isHighlighted,
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
      title: '',
      description: '',
      type: 'PERCENTAGE',
      tier: 'GENERAL',
      discountValue: 0,
      minimumOrderAmount: 0,
      maxDiscountAmount: 0,
      startDate: '',
      endDate: '',
      totalUsageLimit: undefined,
      usagePerCustomerLimit: 1,
      status: 'ACTIVE',
      isHighlighted: false,
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

  const getStatusBadge = (status: PromotionStatus) => {
    const statusConfig = {
      ACTIVE: { label: 'Đang hoạt động', class: 'badge-success' },
      INACTIVE: { label: 'Không hoạt động', class: 'badge-neutral' },
    };

    const config = statusConfig[status] || { label: status, class: 'badge-neutral' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-primary mb-2">Quản lý Khuyến mãi</h1>
          <p className="text-muted">Tổng số: {totalElements} khuyến mãi</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 border border-accent-red bg-red-50 text-accent-red rounded-lg animate-scaleIn">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 border border-secondary bg-[#E8FFED] text-secondary rounded-lg animate-scaleIn">
            {success}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Tìm theo mã hoặc mô tả..."
                className="input-field w-full pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatusFilter(value === 'all' ? undefined : (value as PromotionStatus));
                  setPage(0);
                }}
                className="input-field min-w-[140px]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Không hoạt động</option>
              </select>

              <select
                value={tierFilter || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setTierFilter(value === 'all' ? undefined : (value as PromotionTier));
                  setPage(0);
                }}
                className="input-field min-w-[160px]"
              >
                <option value="all">Tất cả hạng</option>
                <option value="GENERAL">Khuyến mãi chung</option>
                <option value="BRONZE_PLUS">Đồng+</option>
                <option value="SILVER_PLUS">Bạc+</option>
                <option value="GOLD_PLUS">Vàng+</option>
                <option value="PLATINUM_PLUS">Bạch Kim+</option>
                <option value="DIAMOND_ONLY">VIP Kim Cương</option>
                <option value="BIRTHDAY">Sinh nhật</option>
                <option value="FIRST_TIME">Lần đầu</option>
              </select>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <PlusCircle size={20} />
            Tạo khuyến mãi mới
          </button>
        </div>

        {/* Promotions Table */}
        <div className="card overflow-hidden">
          {loading && !promotions.length ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted">Đang tải...</p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <div className="text-lg mb-2">🎁</div>
              <p>Không có khuyến mãi nào</p>
              <p className="text-sm text-light mt-1">Hãy tạo khuyến mãi đầu tiên</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-surface-light">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Mã
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Giá trị
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Sử dụng
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Hạng
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-gray-200">
                    {promotions.map((promotion) => (
                      <tr key={promotion.promotionId} className="hover:bg-surface-light transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="text-sm font-semibold text-text">
                              {promotion.code}
                              {promotion.isHighlighted && (
                                <span className="ml-2 text-yellow-500">⭐</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-text">
                            {promotionService.getTypeLabel(promotion.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-secondary">
                            {promotionService.formatDiscountValue(promotion)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-text">
                            {promotion.currentUsageCount}
                            {promotion.totalUsageLimit ? `/${promotion.totalUsageLimit}` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-text">
                            {promotionService.getTierLabel(promotion.tier)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(promotion.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => openDetailModal(promotion)}
                              className="text-text hover:text-primary transition-colors p-1"
                              title="Chi tiết"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(promotion)}
                              className="text-text hover:text-secondary transition-colors p-1"
                              title="Sửa"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleToggleStatus(
                                  promotion,
                                  promotion.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                                )
                              }
                              className="text-text hover:text-accent-warm transition-colors p-1"
                              title={promotion.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            >
                              {promotion.status === 'ACTIVE' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button
                              onClick={() => openDeleteModal(promotion)}
                              className="text-text hover:text-accent-red transition-colors p-1"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-surface-light px-6 py-4 flex items-center justify-between border-t border-default">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted">
                        Hiển thị <span className="font-semibold text-text">{page * size + 1}</span> đến{' '}
                        <span className="font-semibold text-text">
                          {Math.min((page + 1) * size, totalElements)}
                        </span>{' '}
                        trong tổng số <span className="font-semibold text-text">{totalElements}</span> khuyến mãi
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage(page - 1)}
                          disabled={page === 0}
                          className="btn-secondary rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Trước
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
                              className={`px-4 py-2 border text-sm font-medium transition-colors ${
                                pageNumber === page
                                  ? 'bg-primary text-surface border-primary-dark z-10'
                                  : 'bg-surface border-default text-text hover:bg-surface-light'
                              } ${i === 0 ? 'rounded-l-lg' : ''} ${i === Math.min(totalPages, 5) - 1 ? 'rounded-r-lg' : ''}`}
                            >
                              {pageNumber + 1}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={page >= totalPages - 1}
                          className="btn-secondary rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau →
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
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
            <div className="bg-surface rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto card-hover">
              <h3 className="heading-secondary mb-4">
                {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Mã khuyến mãi <span className="text-accent-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      required
                      maxLength={50}
                      className="input-field w-full"
                      placeholder="VD: SUMMER2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Loại khuyến mãi <span className="text-accent-red">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as PromotionType })
                      }
                      required
                      className="input-field w-full"
                    >
                      <option value="PERCENTAGE">Giảm theo phần trăm</option>
                      <option value="FIXED_AMOUNT">Giảm theo số tiền</option>
                      <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Tiêu đề <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    maxLength={200}
                    className="input-field w-full"
                    placeholder="VD: Giảm giá mùa hè 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    maxLength={1000}
                    className="input-field w-full resize-none"
                    placeholder="Mô tả về khuyến mãi"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Giá trị giảm <span className="text-accent-red">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: Number(e.target.value) })
                      }
                      required
                      min={0}
                      max={formData.type === 'PERCENTAGE' ? 100 : undefined}
                      step={formData.type === 'PERCENTAGE' ? '1' : '1000'}
                      className="input-field w-full"
                      placeholder={formData.type === 'PERCENTAGE' ? '10' : '50000'}
                    />
                    <p className="text-xs text-muted mt-1">
                      {formData.type === 'PERCENTAGE'
                        ? 'Nhập % giảm (0-100)'
                        : 'Nhập số tiền giảm'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Giá trị đơn tối thiểu
                    </label>
                    <input
                      type="number"
                      value={formData.minimumOrderAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, minimumOrderAmount: Number(e.target.value) })
                      }
                      min="0"
                      step="1000"
                      className="input-field w-full"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
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
                      className="input-field w-full"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Hạng khách hàng <span className="text-accent-red">*</span>
                    </label>
                    <select
                      value={formData.tier}
                      onChange={(e) =>
                        setFormData({ ...formData, tier: e.target.value as PromotionTier })
                      }
                      required
                      className="input-field w-full"
                    >
                      <option value="GENERAL">Khuyến mãi chung</option>
                      <option value="BRONZE_PLUS">Đồng+</option>
                      <option value="SILVER_PLUS">Bạc+</option>
                      <option value="GOLD_PLUS">Vàng+</option>
                      <option value="PLATINUM_PLUS">Bạch Kim+</option>
                      <option value="DIAMOND_ONLY">VIP Kim Cương</option>
                      <option value="BIRTHDAY">Sinh nhật</option>
                      <option value="FIRST_TIME">Lần đầu</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Ngày bắt đầu <span className="text-accent-red">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Ngày kết thúc <span className="text-accent-red">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Số lượng sử dụng tối đa
                    </label>
                    <input
                      type="number"
                      value={formData.totalUsageLimit || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalUsageLimit: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      min="1"
                      className="input-field w-full"
                      placeholder="Không giới hạn"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Số lần dùng/người
                    </label>
                    <input
                      type="number"
                      value={formData.usagePerCustomerLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usagePerCustomerLimit: Number(e.target.value),
                        })
                      }
                      min="1"
                      className="input-field w-full"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Trạng thái <span className="text-accent-red">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as PromotionStatus })
                      }
                      required
                      className="input-field w-full"
                    >
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="INACTIVE">Không hoạt động</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="isHighlighted"
                      checked={formData.isHighlighted}
                      onChange={(e) =>
                        setFormData({ ...formData, isHighlighted: e.target.checked })
                      }
                      className="h-4 w-4 text-primary focus:ring-primary border-default rounded"
                    />
                    <label htmlFor="isHighlighted" className="ml-2 block text-sm text-text">
                      Nổi bật (hiển thị ở trang chủ)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-default">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary px-6 py-2"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-surface border-t-transparent"></div>
                        Đang xử lý...
                      </span>
                    ) : editingPromotion ? (
                      'Cập nhật'
                    ) : (
                      'Tạo mới'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedPromotion && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
            <div className="bg-surface rounded-lg p-6 w-full max-w-md mx-4 card-hover">
              <h3 className="heading-secondary mb-4">Chi tiết khuyến mãi</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-text">Mã:</span>
                  <span className="text-sm font-bold text-text">
                    {selectedPromotion.code}
                    {selectedPromotion.isHighlighted && (
                      <span className="ml-2 text-yellow-500">⭐</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-text">Tiêu đề:</span>
                  <span className="text-sm font-semibold text-text text-right">
                    {selectedPromotion.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-text">Loại:</span>
                  <span className="text-sm text-text">
                    {promotionService.getTypeLabel(selectedPromotion.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-text">Giá trị:</span>
                  <span className="text-sm font-bold text-secondary">
                    {promotionService.formatDiscountValue(selectedPromotion)}
                  </span>
                </div>
                {selectedPromotion.minimumOrderAmount && selectedPromotion.minimumOrderAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-text">Đơn hàng tối thiểu:</span>
                    <span className="text-sm text-text">
                      {selectedPromotion.minimumOrderAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
                {selectedPromotion.maxDiscountAmount && selectedPromotion.maxDiscountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-text">Giảm tối đa:</span>
                    <span className="text-sm text-text">
                      {selectedPromotion.maxDiscountAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-text">Thời gian:</span>
                  <span className="text-sm text-text text-right">
                    {selectedPromotion.startDate}<br/>đến {selectedPromotion.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-text">Đã sử dụng:</span>
                  <span className="text-sm text-text">
                    {selectedPromotion.currentUsageCount}
                    {selectedPromotion.totalUsageLimit
                      ? `/${selectedPromotion.totalUsageLimit}`
                      : ' (Không giới hạn)'}
                  </span>
                </div>
                {selectedPromotion.usagePerCustomerLimit && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-text">Giới hạn/người:</span>
                    <span className="text-sm text-text">
                      {selectedPromotion.usagePerCustomerLimit} lần
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-text">Hạng khách hàng:</span>
                  <span className="text-sm text-text">
                    {promotionService.getTierLabel(selectedPromotion.tier)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-text">Trạng thái:</span>
                  {getStatusBadge(selectedPromotion.status)}
                </div>
                {selectedPromotion.isExpired && (
                  <div className="p-2 bg-red-50 border border-accent-red rounded">
                    <span className="text-sm text-accent-red font-medium">
                      Khuyến mãi đã hết hạn
                    </span>
                  </div>
                )}
                {selectedPromotion.description && (
                  <div>
                    <span className="text-sm font-medium text-text">Mô tả:</span>
                    <p className="text-sm text-text mt-1 bg-surface-light p-2 rounded border border-default">
                      {selectedPromotion.description}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && promotionToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-surface rounded-lg p-6 w-96 mx-4 card-hover">
              <div className="text-center">
                <h3 className="heading-secondary mb-2">Xác nhận xóa</h3>
                <div className="mt-2 px-2 py-3">
                  <p className="text-sm text-muted">
                    Bạn có chắc chắn muốn xóa khuyến mãi "
                    <strong className="text-text">{promotionToDelete.code}</strong>"?
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
                    className="btn-secondary px-4 py-2"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="btn-primary bg-accent-red hover:bg-red-600 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-surface border-t-transparent"></div>
                        Đang xóa...
                      </span>
                    ) : (
                      'Xóa'
                    )}
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