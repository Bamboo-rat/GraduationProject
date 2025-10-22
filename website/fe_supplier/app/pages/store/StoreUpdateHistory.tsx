import { useState, useEffect } from 'react';
import storeService from '~/service/storeService';
import type { StorePendingUpdate, StoreUpdateListParams } from '~/service/storeService';

export default function StoreUpdateHistory() {
  const [updates, setUpdates] = useState<StorePendingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('');
  const [selectedUpdate, setSelectedUpdate] = useState<StorePendingUpdate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const params: StoreUpdateListParams = {
        page: currentPage,
        size: 10,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await storeService.getMyPendingUpdates(params);
      setUpdates(response.content);
      setTotalPages(response.page.totalPages);
      setTotalElements(response.page.totalElements);
    } catch (error) {
      console.error('Error fetching updates:', error);
      alert('Lỗi khi tải lịch sử cập nhật');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [currentPage, statusFilter]);

  const openDetailModal = (update: StorePendingUpdate) => {
    setSelectedUpdate(update);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Bị từ chối', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderChangeField = (label: string, oldValue: string | number | undefined, newValue: string | number | undefined) => {
    if (newValue === undefined || newValue === oldValue) return null;

    return (
      <div className="py-2 border-b">
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-red-600 line-through">{oldValue || 'N/A'}</span>
          <span className="text-gray-400">→</span>
          <span className="text-green-600 font-medium">{newValue || 'N/A'}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Lịch sử cập nhật cửa hàng</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded ${!statusFilter ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 rounded ${statusFilter === 'PENDING' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Chờ duyệt
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-4 py-2 rounded ${statusFilter === 'APPROVED' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Đã duyệt
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-4 py-2 rounded ${statusFilter === 'REJECTED' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Bị từ chối
            </button>
          </div>
        </div>
      </div>

      {/* Updates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày gửi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thông tin thay đổi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phản hồi Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {updates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Chưa có yêu cầu cập nhật nào
                </td>
              </tr>
            ) : (
              updates.map((update) => {
                const changes = [];
                if (update.newStoreName) changes.push('Tên cửa hàng');
                if (update.newAddress) changes.push('Địa chỉ');
                if (update.newPhoneNumber) changes.push('Số điện thoại');
                if (update.newDescription) changes.push('Mô tả');
                if (update.newLatitude !== undefined || update.newLongitude !== undefined) changes.push('Tọa độ');

                return (
                  <tr key={update.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(update.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {changes.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(update.status)}
                    </td>
                    <td className="px-6 py-4">
                      {update.adminNotes ? (
                        <div className="text-sm text-gray-600">
                          {update.adminNotes}
                          {update.processorName && (
                            <div className="text-xs text-gray-400 mt-1">
                              Bởi: {update.processorName} -{' '}
                              {update.processedAt &&
                                new Date(update.processedAt).toLocaleString('vi-VN')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Chưa có phản hồi</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openDetailModal(update)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{currentPage * 10 + 1}</span> đến{' '}
                  <span className="font-medium">
                    {Math.min((currentPage + 1) * 10, totalElements)}
                  </span>{' '}
                  trong tổng số <span className="font-medium">{totalElements}</span> yêu cầu
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chi tiết yêu cầu cập nhật</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Trạng thái:</span>
                {getStatusBadge(selectedUpdate.status)}
              </div>
              <div className="text-sm text-gray-600">
                Ngày gửi: {new Date(selectedUpdate.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Thông tin thay đổi:</h3>
              {renderChangeField('Tên cửa hàng', selectedUpdate.currentStoreName, selectedUpdate.newStoreName)}
              {renderChangeField('Địa chỉ', selectedUpdate.currentAddress, selectedUpdate.newAddress)}
              {renderChangeField('Số điện thoại', selectedUpdate.currentPhoneNumber, selectedUpdate.newPhoneNumber)}
              {renderChangeField('Mô tả', selectedUpdate.currentDescription, selectedUpdate.newDescription)}
              {renderChangeField('Latitude', selectedUpdate.currentLatitude, selectedUpdate.newLatitude)}
              {renderChangeField('Longitude', selectedUpdate.currentLongitude, selectedUpdate.newLongitude)}
            </div>

            {selectedUpdate.adminNotes && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Phản hồi từ Admin:</h3>
                <p className="text-sm text-gray-700">{selectedUpdate.adminNotes}</p>
                {selectedUpdate.processorName && (
                  <div className="text-xs text-gray-500 mt-2">
                    Xử lý bởi: {selectedUpdate.processorName} -{' '}
                    {selectedUpdate.processedAt &&
                      new Date(selectedUpdate.processedAt).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
