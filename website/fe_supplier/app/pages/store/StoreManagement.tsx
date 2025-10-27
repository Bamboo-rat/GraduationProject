import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import storeService from '~/service/storeService';
import type { StoreResponse, StoreStatus } from '~/service/storeService';

export default function StoreManagement() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 12;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoreStatus | undefined>(undefined);
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
      const response = await storeService.getMyStores({
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

  // const openDetailModal = (store: StoreResponse) => {
  //   setSelectedStore(store);
  //   setShowDetailModal(true);
  // };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedStore(null);
  };

  const handleCreateStore = () => {
    navigate('/store/create');
  };

  const handleEditStore = (storeId: string) => {
    navigate(`/store/edit/${storeId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && stores.length === 0) {
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Quản lý Cửa hàng</h1>
          <p className="text-gray-600">Tổng số: {totalElements} cửa hàng</p>
        </div>
        <button
          onClick={handleCreateStore}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo cửa hàng mới
        </button>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={statusFilter || 'all'}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value === 'all' ? undefined : (value as StoreStatus));
                setPage(0);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="SUSPENDED">Tạm ngừng</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-gray-500 mb-4">
              {debouncedSearch || statusFilter
                ? 'Không tìm thấy cửa hàng nào phù hợp'
                : 'Bạn chưa có cửa hàng nào'}
            </p>
            {!debouncedSearch && !statusFilter && (
              <button
                onClick={handleCreateStore}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Tạo cửa hàng đầu tiên
              </button>
            )}
          </div>
        ) : (
          stores.map((store) => (
            <div key={store.storeId} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {/* Store Image */}
              <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                {store.imageUrls && store.imageUrls.length > 0 ? (
                  <img
                    src={store.imageUrls[0]}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${storeService.getStatusColorClass(
                      store.status
                    )}`}
                  >
                    {storeService.getStatusLabel(store.status)}
                  </span>
                </div>
              </div>

              {/* Store Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{store.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="line-clamp-2">{storeService.formatFullAddress(store)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{store.phoneNumber}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Tạo: {formatDate(store.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/store/profile?storeId=${store.storeId}`)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Chi tiết
                  </button>
                  {store.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleEditStore(store.storeId)}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Trang {page + 1} / {totalPages} - Tổng {totalElements} cửa hàng
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
      {showDetailModal && selectedStore && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Chi tiết cửa hàng</h3>
                <button onClick={closeDetailModal} className="text-gray-400 hover:text-gray-600">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tên cửa hàng</label>
                    <p className="text-gray-900">{selectedStore.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Trạng thái</label>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${storeService.getStatusColorClass(
                        selectedStore.status
                      )}`}
                    >
                      {storeService.getStatusLabel(selectedStore.status)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Địa chỉ</label>
                    <p className="text-gray-900">{storeService.formatFullAddress(selectedStore)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                    <p className="text-gray-900">{selectedStore.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-gray-900">{selectedStore.email || 'Không có'}</p>
                  </div>
                  {(selectedStore.latitude || selectedStore.longitude) && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Tọa độ GPS</label>
                      <p className="text-gray-900">
                        {selectedStore.latitude}, {selectedStore.longitude}
                      </p>
                    </div>
                  )}
                  {selectedStore.description && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Mô tả</label>
                      <p className="text-gray-900">{selectedStore.description}</p>
                    </div>
                  )}
                  {selectedStore.openingHours && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Giờ mở cửa</label>
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
                      <label className="block text-sm font-medium text-gray-600 mb-1">Ghi chú từ Admin</label>
                      <p className="text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200">
                        {selectedStore.adminNotes}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ngày tạo</label>
                    <p className="text-gray-900">{formatDate(selectedStore.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Cập nhật lần cuối</label>
                    <p className="text-gray-900">{formatDate(selectedStore.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeDetailModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Đóng
                </button>
                {selectedStore.status !== 'REJECTED' && (
                  <button
                    onClick={() => {
                      closeDetailModal();
                      handleEditStore(selectedStore.storeId);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
