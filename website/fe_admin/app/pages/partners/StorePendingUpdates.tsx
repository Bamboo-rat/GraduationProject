import { useState, useEffect } from 'react';
import { storeUpdateService, type StorePendingUpdate, type StorePendingUpdateParams } from '~/service/storeUpdateService';
import type { PaginatedResponse } from '~/service/types';
import DashboardLayout from '~/component/layout/DashboardLayout';

export default function StorePendingUpdatesPage() {
  const [updates, setUpdates] = useState<StorePendingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  });
  const [selectedUpdate, setSelectedUpdate] = useState<StorePendingUpdate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchUpdates();
  }, [pagination.page, statusFilter]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const params: StorePendingUpdateParams = {
        page: pagination.page,
        size: pagination.size,
        status: statusFilter,
        sort: 'createdAt,desc',
      };
      
      const response = await storeUpdateService.getAllPendingUpdates(params);
      
      if (response.data) {
        const data = response.data as PaginatedResponse<StorePendingUpdate>;
        setUpdates(data.content);
        setPagination(prev => ({
          ...prev,
          totalPages: data.page.totalPages,
          totalElements: data.page.totalElements,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
      alert('Không thể tải danh sách cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (update: StorePendingUpdate) => {
    setSelectedUpdate(update);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUpdate(null);
  };

  const openActionModal = (update: StorePendingUpdate, type: 'approve' | 'reject') => {
    setSelectedUpdate(update);
    setModalType(type);
    setShowActionModal(true);
    setAdminNotes('');
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedUpdate(null);
    setAdminNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedUpdate) return;

    if (modalType === 'reject' && !adminNotes.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      if (modalType === 'approve') {
        await storeUpdateService.approveUpdate(
          selectedUpdate.updateId,
          adminNotes || undefined
        );
        alert('Duyệt cập nhật cửa hàng thành công!');
      } else {
        await storeUpdateService.rejectUpdate(
          selectedUpdate.updateId,
          adminNotes
        );
        alert('Từ chối cập nhật cửa hàng thành công!');
      }
      closeActionModal();
      fetchUpdates();
    } catch (error) {
      console.error('Failed to process update:', error);
      alert(`Không thể ${modalType === 'approve' ? 'duyệt' : 'từ chối'} cập nhật`);
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

  const renderChangeField = (label: string, oldValue: string, newValue?: string) => {
    if (!newValue || newValue === oldValue) return null;

    return (
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}:</label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm line-through text-gray-600">
            {oldValue || '(Trống)'}
          </div>
          <span>→</span>
          <div className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm font-medium text-gray-900">
            {newValue}
          </div>
        </div>
      </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Cập nhật thông tin cửa hàng</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các yêu cầu cập nhật từ nhà cung cấp
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

      {updates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">Không có yêu cầu cập nhật nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cửa hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thay đổi
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
              {updates.map((update) => (
                <tr key={update.updateId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{update.currentStoreName}</div>
                    <div className="text-xs text-gray-500">ID: {update.storeId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {[
                        update.storeName && 'Tên',
                        update.address && 'Địa chỉ',
                        update.phoneNumber && 'SĐT',
                        update.description && 'Mô tả',
                        (update.latitude || update.longitude) && 'Vị trí',
                      ].filter(Boolean).join(', ') || 'Không có thay đổi'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(update.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(update.createdAt).toLocaleTimeString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(update.updateStatus)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openDetailModal(update)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Chi tiết
                    </button>
                    {update.updateStatus === 'PENDING' && (
                      <>
                        <button
                          onClick={() => openActionModal(update, 'approve')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => openActionModal(update, 'reject')}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          Từ chối
                        </button>
                      </>
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

      {/* Detail Modal */}
      {showDetailModal && selectedUpdate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Chi tiết yêu cầu cập nhật
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">Cửa hàng: <span className="font-medium">{selectedUpdate.currentStoreName}</span></p>
                <p className="text-sm text-gray-600">Trạng thái: {getStatusBadge(selectedUpdate.updateStatus)}</p>
              </div>

              <div className="border-t pt-4">
                {renderChangeField('Tên cửa hàng', selectedUpdate.currentStoreName, selectedUpdate.storeName)}
                {renderChangeField('Địa chỉ', '', selectedUpdate.address)}
                {renderChangeField('Số điện thoại', '', selectedUpdate.phoneNumber)}
                {renderChangeField('Mô tả', '', selectedUpdate.description)}
                {(selectedUpdate.latitude || selectedUpdate.longitude) && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí GPS:</label>
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      {selectedUpdate.latitude}, {selectedUpdate.longitude}
                    </div>
                  </div>
                )}
              </div>

              {selectedUpdate.adminNotes && (
                <div className="mt-4 border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú admin:</label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedUpdate.adminNotes}</p>
                </div>
              )}

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

      {/* Action Modal */}
      {showActionModal && selectedUpdate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalType === 'approve' ? 'Duyệt' : 'Từ chối'} cập nhật: {selectedUpdate.currentStoreName}
              </h3>

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
                  onClick={closeActionModal}
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
