import { useState, useEffect } from 'react';
import { categorySuggestionService, type CategorySuggestion, type CategorySuggestionParams } from '~/service/categorySuggestionService';
import type { PaginatedResponse } from '~/service/types';
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
      
      const response = await categorySuggestionService.getAllSuggestions(params);
      
      if (response.data) {
        const data = response.data as PaginatedResponse<CategorySuggestion>;
        setSuggestions(data.content);
        setPagination(prev => ({
          ...prev,
          totalPages: data.page.totalPages,
          totalElements: data.page.totalElements,
        }));
      }
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
      PENDING: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-800' },
    };

    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đề xuất danh mục sản phẩm</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các đề xuất danh mục từ nhà cung cấp
          </p>
        </div>

        <div className="flex space-x-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status === 'ALL' ? '' : status);
                setPagination(prev => ({ ...prev, page: 0 }));
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                (statusFilter === status || (status === 'ALL' && !statusFilter))
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Không có đề xuất nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nhà cung cấp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Lý do đề xuất
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suggestions.map((suggestion) => (
                <tr key={suggestion.suggestionId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{suggestion.suggesterBusinessName}</div>
                    <div className="text-xs text-gray-500">{suggestion.suggesterName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {suggestion.reason || '(Không có)'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(suggestion.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(suggestion.createdAt).toLocaleTimeString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(suggestion.status)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {suggestion.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => openModal(suggestion, 'approve')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => openModal(suggestion, 'reject')}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {suggestion.status !== 'PENDING' && (
                      <div className="text-sm text-gray-500">
                        {suggestion.processorName && `Xử lý bởi: ${suggestion.processorName}`}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-700">
                  Trang {pagination.page + 1} / {pagination.totalPages}
                </p>
              </div>
              <div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 0}
                  className="mr-2 px-4 py-2 text-sm border rounded disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages - 1}
                  className="px-4 py-2 text-sm border rounded disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalType === 'approve' ? 'Duyệt' : 'Từ chối'} đề xuất: {selectedSuggestion.name}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do đề xuất:
                </label>
                <p className="text-sm text-gray-600">{selectedSuggestion.reason || '(Không có)'}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú của admin {modalType === 'reject' && '(*)'}:
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={modalType === 'reject' ? 'Nhập lý do từ chối...' : 'Nhập ghi chú (tùy chọn)...'}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    modalType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Xác nhận {modalType === 'approve' ? 'duyệt' : 'từ chối'}
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
