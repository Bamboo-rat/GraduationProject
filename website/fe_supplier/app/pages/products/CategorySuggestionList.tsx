import { useState, useEffect } from 'react';
import categorySuggestionService from '~/service/categorySuggestionService';
import type { CategorySuggestion, CategorySuggestionListParams } from '~/service/categorySuggestionService';

export default function CategorySuggestionList() {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [reason, setReason] = useState('');

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const params: CategorySuggestionListParams = {
        page: currentPage,
        size: 10,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response: any = await categorySuggestionService.getMySuggestions(params);

      // Defensive handling for different pagination shapes
      const content = response?.content ?? [];
      const page = response?.page ?? {
        totalPages: response?.totalPages ?? 0,
        totalElements: response?.totalElements ?? 0,
        size: response?.size ?? 10,
        number: response?.number ?? currentPage,
      };

      setSuggestions(content);
      setTotalPages(page.totalPages ?? 0);
      setTotalElements(page.totalElements ?? 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      alert('Lỗi khi tải danh sách đề xuất');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [currentPage, statusFilter]);

  const handleCreateSuggestion = async () => {
    if (!newCategoryName.trim() || !reason.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      await categorySuggestionService.createSuggestion({
        categoryName: newCategoryName.trim(),
        reason: reason.trim(),
      });
      alert('Gửi đề xuất thành công');
      setShowCreateModal(false);
      setNewCategoryName('');
      setReason('');
      setCurrentPage(0);
      fetchSuggestions();
    } catch (error) {
      console.error('Error creating suggestion:', error);
      alert('Lỗi khi tạo đề xuất');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Chờ duyệt', class: 'badge-warning' },
      APPROVED: { label: 'Đã duyệt', class: 'badge-success' },
      REJECTED: { label: 'Bị từ chối', class: 'badge-error' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, class: 'badge-neutral' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted animate-pulse">Đang tải danh sách đề xuất...</div>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="heading-primary mb-2">Đề xuất danh mục sản phẩm</h1>
        <p className="text-muted mb-6">Gửi đề xuất danh mục mới và theo dõi trạng thái</p>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                !statusFilter ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                statusFilter === 'PENDING' ? 'btn-primary' : 'bg-surface border-default border text-text hover:bg-surface-light'
              }`}
            >
              Chờ duyệt
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                statusFilter === 'APPROVED' ? 'btn-primary' : 'bg-surface border-default border text-text hover:bg-surface-light'
              }`}
            >
              Đã duyệt
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                statusFilter === 'REJECTED' ? 'btn-primary' : 'bg-surface border-default border text-text hover:bg-surface-light'
              }`}
            >
              Bị từ chối
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-secondary lg:ml-auto whitespace-nowrap"
          >
            + Đề xuất danh mục mới
          </button>
        </div>
      </div>

      {/* Suggestions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-surface-light">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Tên danh mục
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Lý do đề xuất
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Ngày gửi
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                  Phản hồi Admin
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-gray-200">
              {suggestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-lg mb-2">💡</div>
                      <p>Chưa có đề xuất nào</p>
                      <p className="text-sm text-light mt-1">
                        Hãy tạo đề xuất đầu tiên để đề xuất danh mục mới
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                suggestions.map((suggestion) => (
                  <tr key={suggestion.id} className="hover:bg-surface-light transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-text">{suggestion.categoryName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted max-w-xs">{suggestion.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {new Date(suggestion.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(suggestion.status)}
                    </td>
                    <td className="px-6 py-4">
                      {suggestion.adminNotes ? (
                        <div className="text-sm text-text">
                          <div className="font-medium mb-1">📝 Phản hồi:</div>
                          <div className="text-muted bg-surface-light p-3 rounded-lg border border-default">
                            {suggestion.adminNotes}
                          </div>
                          {suggestion.processorName && (
                            <div className="text-xs text-light mt-2">
                              Xử lý bởi: <span className="font-medium">{suggestion.processorName}</span> -{' '}
                              {suggestion.processedAt &&
                                new Date(suggestion.processedAt).toLocaleString('vi-VN')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-light italic">Chưa có phản hồi</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="bg-surface-light px-6 py-4 flex items-center justify-between border-t border-default">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted">
                  Hiển thị <span className="font-semibold text-text">{currentPage * 10 + 1}</span> đến{' '}
                  <span className="font-semibold text-text">
                    {Math.min((currentPage + 1) * 10, totalElements)}
                  </span>{' '}
                  trong tổng số <span className="font-semibold text-text">{totalElements}</span> đề xuất
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="btn-secondary rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Trước
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`px-4 py-2 border text-sm font-medium transition-colors ${
                        currentPage === i
                          ? 'bg-primary text-surface border-primary-dark z-10'
                          : 'bg-surface border-default text-text hover:bg-surface-light'
                      } ${i === 0 ? 'rounded-l-lg' : ''} ${i === Math.min(totalPages, 5) - 1 ? 'rounded-r-lg' : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="btn-secondary rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md mx-4 card-hover">
            <h2 className="heading-secondary mb-4">Đề xuất danh mục mới</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-2">
                Tên danh mục <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ví dụ: Thực phẩm hữu cơ, Đồ uống tự nhiên..."
                className="input-field w-full"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text mb-2">
                Lý do đề xuất <span className="text-accent-red">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mô tả lý do tại sao nên thêm danh mục này, lợi ích mang lại..."
                rows={4}
                className="input-field w-full resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCategoryName('');
                  setReason('');
                }}
                className="btn-secondary px-4 py-2"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateSuggestion}
                className="btn-primary px-4 py-2"
              >
                Gửi đề xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}