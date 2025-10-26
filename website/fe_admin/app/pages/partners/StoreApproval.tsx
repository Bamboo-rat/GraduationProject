import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import storeService from '~/service/storeService';
import type { StoreResponse } from '~/service/storeService';

export default function StoreApproval() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
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
    fetchStores();
  }, [page, statusFilter, debouncedSearch]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storeService.getAllStores({
        page,
        size,
        status: statusFilter,
        search: debouncedSearch,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
      });
      setStores(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (store: StoreResponse) => {
    setSelectedStore(store);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedStore(null);
  };

  const openActionModal = (store: StoreResponse, type: 'approve' | 'reject') => {
    setSelectedStore(store);
    setModalType(type);
    setShowActionModal(true);
    setAdminNotes('');
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedStore(null);
    setAdminNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedStore) return;

    if (modalType === 'reject' && !adminNotes.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      if (modalType === 'approve') {
        await storeService.approveStore(selectedStore.storeId, adminNotes || undefined);
        alert('Duyệt cửa hàng thành công!');
      } else {
        await storeService.rejectStore(selectedStore.storeId, adminNotes);
        alert('Từ chối cửa hàng thành công!');
      }
      closeActionModal();
      fetchStores();
    } catch (err: any) {
      alert(err.message || `Không thể ${modalType === 'approve' ? 'duyệt' : 'từ chối'} cửa hàng`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800' },
      ACTIVE: { label: 'Hoạt động', className: 'bg-green-100 text-green-800' },
      SUSPENDED: { label: 'Tạm ngừng', className: 'bg-red-100 text-red-800' },
      REJECTED: { label: 'Bị từ chối', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (store: StoreResponse) => {
    return [store.address, store.ward, store.district, store.city].filter(Boolean).join(', ');
  };

  if (loading && stores.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Duyệt Cửa hàng mới</h1>
          <p className="text-gray-600">
            Tổng số: {totalElements} cửa hàng {statusFilter === 'PENDING' ? 'chờ duyệt' : ''}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
            <button
              onClick={fetchStores}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tìm theo tên cửa hàng, địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PENDING">Chờ duyệt</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="SUSPENDED">Tạm ngừng</option>
                <option value="REJECTED">Bị từ chối</option>
                <option value="">Tất cả</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {debouncedSearch || statusFilter !== 'PENDING'
                ? 'Không tìm thấy cửa hàng nào phù hợp'
                : 'Không có cửa hàng chờ duyệt'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cửa hàng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Địa chỉ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nhà cung cấp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stores.map((store) => (
                      <tr key={store.storeId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {store.imageUrls && store.imageUrls.length > 0 && (
                              <img
                                className="h-10 w-10 rounded object-cover mr-3"
                                src={store.imageUrls[0]}
                                alt={store.name}
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{store.name}</div>
                              <div className="text-sm text-gray-500">{store.phoneNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {formatAddress(store)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{store.supplierName || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(store.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(store.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => openDetailModal(store)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Chi tiết
                          </button>
                          {store.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => openActionModal(store, 'approve')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => openActionModal(store, 'reject')}
                                className="text-red-600 hover:text-red-900"
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
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
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
                        <span className="font-medium">{Math.min((page + 1) * size, totalElements)}</span>{' '}
                        trong tổng số <span className="font-medium">{totalElements}</span> cửa hàng
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage(Math.max(0, page - 1))}
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
                          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
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

        {/* Detail Modal */}
        {showDetailModal && selectedStore && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="mt-3">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết cửa hàng</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Tên cửa hàng</label>
                    <p className="text-gray-900">{selectedStore.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Trạng thái</label>
                    <div>{getStatusBadge(selectedStore.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600">Địa chỉ</label>
                    <p className="text-gray-900">{formatAddress(selectedStore)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Số điện thoại</label>
                    <p className="text-gray-900">{selectedStore.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedStore.email || 'Không có'}</p>
                  </div>
                  {(selectedStore.latitude || selectedStore.longitude) && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600">Tọa độ GPS</label>
                      <p className="text-gray-900">
                        {selectedStore.latitude}, {selectedStore.longitude}
                      </p>
                    </div>
                  )}
                  {selectedStore.description && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600">Mô tả</label>
                      <p className="text-gray-900">{selectedStore.description}</p>
                    </div>
                  )}
                  {selectedStore.openingHours && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600">Giờ mở cửa</label>
                      <p className="text-gray-900">{selectedStore.openingHours}</p>
                    </div>
                  )}
                  {selectedStore.imageUrls && selectedStore.imageUrls.length > 0 && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-2">Hình ảnh</label>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedStore.imageUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Store ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedStore.adminNotes && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600">Ghi chú Admin</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedStore.adminNotes}</p>
                    </div>
                  )}
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

        {/* Action Modal */}
        {showActionModal && selectedStore && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {modalType === 'approve' ? 'Duyệt' : 'Từ chối'} cửa hàng: {selectedStore.name}
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú của admin {modalType === 'reject' && '(*)'}:
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      modalType === 'reject'
                        ? 'Nhập lý do từ chối...'
                        : 'Nhập ghi chú (tùy chọn)...'
                    }
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
