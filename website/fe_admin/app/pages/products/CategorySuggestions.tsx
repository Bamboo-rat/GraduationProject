import { useState, useEffect } from 'react';
import { categorySuggestionService, type CategorySuggestion, type CategorySuggestionParams } from '~/service/categorySuggestionService';
import DashboardLayout from '~/component/layout/DashboardLayout';

export default function CategorySuggestionsPage() {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  });
  const [selectedSuggestion, setSelectedSuggestion] = useState<CategorySuggestion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchSuggestions();
  }, [pagination.page, statusFilter]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const params: CategorySuggestionParams = {
        page: pagination.page,
        size: pagination.size,
        status: statusFilter,
        sort: 'createdAt,desc',
      };

      const data = await categorySuggestionService.getAllSuggestions(params);

      setSuggestions(data.content);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
      }));
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      alert('Không thể tải danh sách đề xuất');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (suggestion: CategorySuggestion, type: 'approve' | 'reject') => {
    setSelectedSuggestion(suggestion);
    setModalType(type);
    setShowModal(true);
    setAdminNotes('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSuggestion(null);
    setAdminNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedSuggestion) return;

    if (modalType === 'reject' && !adminNotes.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      if (modalType === 'approve') {
        await categorySuggestionService.approveSuggestion(
          selectedSuggestion.suggestionId,
          adminNotes || undefined
        );
        alert('Duyệt đề xuất danh mục thành công!');
      } else {
        await categorySuggestionService.rejectSuggestion(
          selectedSuggestion.suggestionId,
          adminNotes
        );
        alert('Từ chối đề xuất danh mục thành công!');
      }
      closeModal();
      fetchSuggestions();
    } catch (error) {
      console.error('Failed to process suggestion:', error);
      alert(`Không thể ${modalType === 'approve' ? 'duyệt' : 'từ chối'} đề xuất`);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ duyệt', className: 'badge-warning' },
      APPROVED: { label: 'Đã duyệt', className: 'badge-success' },
      REJECTED: { label: 'Từ chối', className: 'badge-error' },
    };

    const badge = badges[status] || { label: status, className: 'badge-neutral' };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F855A]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="heading-primary">Đề xuất danh mục sản phẩm</h1>
            <p className="text-muted mt-2">
              Quản lý các đề xuất danh mục từ nhà cung cấp
            </p>
          </div>

          <div className="flex space-x-3">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status === 'ALL' ? '' : status);
                  setPagination(prev => ({ ...prev, page: 0 }));
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  (statusFilter === status || (status === 'ALL' && !statusFilter))
                    ? 'btn-primary shadow-sm'
                    : 'bg-surface text-text border border-default hover:bg-surface-light hover:shadow-sm'
                }`}
              >
                {status === 'PENDING' && 'Chờ duyệt'}
                {status === 'APPROVED' && 'Đã duyệt'}
                {status === 'REJECTED' && 'Từ chối'}
                {status === 'ALL' && 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {suggestions.length === 0 ? (
          <div className="card text-center py-16 animate-fadeIn">
            <p className="text-light text-lg">Không có đề xuất nào</p>
          </div>
        ) : (
          <div className="card overflow-hidden animate-scaleIn">
            <table className="min-w-full divide-y divide-[#B7E4C7]">
              <thead className="bg-surface-light">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                    Lý do đề xuất
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-[#B7E4C7]">
                {suggestions.map((suggestion) => (
                  <tr key={suggestion.suggestionId} className="hover:bg-surface-light transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-text">{suggestion.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-text">{suggestion.supplierBusinessName}</div>
                      <div className="text-xs text-muted mt-1">{suggestion.supplierName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text max-w-xs">
                        {suggestion.reason || '(Không có)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text">
                        {new Date(suggestion.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-light mt-1">
                        {new Date(suggestion.createdAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(suggestion.status)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {suggestion.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openModal(suggestion, 'approve')}
                            className="group relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gradient-to-r from-[#2F855A] to-[#8FB491] text-surface hover:from-[#8FB491] hover:to-[#2F855A] hover:shadow-md active:scale-95"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Duyệt
                            <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#2F855A] to-[#8FB491] opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></span>
                          </button>
                          
                          <button
                            onClick={() => openModal(suggestion, 'reject')}
                            className="group relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gradient-to-r from-[#E63946] to-[#FF6B35] text-surface hover:from-[#FF6B35] hover:to-[#E63946] hover:shadow-md active:scale-95"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Từ chối
                            <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#E63946] to-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></span>
                          </button>
                        </>
                      )}
                      {suggestion.status !== 'PENDING' && suggestion.adminName && (
                        <div className="text-sm text-muted inline-block">
                          Xử lý bởi: {suggestion.adminName}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-surface-light px-6 py-4 flex items-center justify-between border-t border-default">
                <div>
                  <p className="text-sm text-muted">
                    Hiển thị {suggestions.length} của {pagination.totalElements} đề xuất
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 0}
                    className="btn-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm"
                  >
                    ← Trước
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages - 1}
                    className="btn-secondary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && selectedSuggestion && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
            <div className="relative top-20 mx-auto p-6 w-[500px] shadow-lg rounded-lg bg-surface animate-scaleIn">
              <div className="mb-6">
                <h3 className="heading-secondary mb-2">
                  {modalType === 'approve' ? 'Duyệt' : 'Từ chối'} đề xuất
                </h3>
                <p className="text-text font-medium">"{selectedSuggestion.name}"</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">
                  Lý do đề xuất:
                </label>
                <div className="bg-surface-light p-4 rounded-lg border border-default">
                  <p className="text-sm text-text">{selectedSuggestion.reason || '(Không có)'}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-2">
                  Ghi chú của admin {modalType === 'reject' && <span className="text-[#E63946]">*</span>}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={modalType === 'reject' ? 'Nhập lý do từ chối...' : 'Nhập ghi chú (tùy chọn)...'}
                  rows={4}
                  className="input-field w-full"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="group inline-flex items-center px-4 py-2 text-sm font-medium text-text bg-surface-light border border-default rounded-lg hover:bg-[#F5EDE6] transition-all duration-200 hover:shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  className={`group inline-flex items-center px-4 py-2 text-sm font-medium text-surface rounded-lg transition-all duration-200 hover:shadow-md active:scale-95 ${
                    modalType === 'approve'
                      ? 'bg-gradient-to-r from-[#2F855A] to-[#8FB491] hover:from-[#8FB491] hover:to-[#2F855A]'
                      : 'bg-gradient-to-r from-[#E63946] to-[#FF6B35] hover:from-[#FF6B35] hover:to-[#E63946]'
                  }`}
                >
                  {modalType === 'approve' ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Xác nhận duyệt
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Xác nhận từ chối
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}