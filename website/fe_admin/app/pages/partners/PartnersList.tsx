import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import supplierService  from '~/service/supplierService';
import type { Supplier, SupplierStatus } from '~/service/supplierService';

export default function PartnersList() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchSuppliers();
  }, [page, statusFilter, debouncedSearch]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await supplierService.getAllSuppliers(
        page,
        size,
        statusFilter,
        debouncedSearch,
        'createdAt',
        'DESC'
      );
      setSuppliers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đối tác');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SupplierStatus) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${supplierService.getStatusColorClass(status)}`}>
        {supplierService.getStatusLabel(status)}
      </span>
    );
  };

  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const handleViewDetail = (supplierId: string) => {
    // Navigate to supplier detail page (to be implemented)
    navigate(`/partners/${supplierId}`);
  };

  const handleSuspendClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const handleUnsuspendClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowUnsuspendModal(true);
  };

  const handleSuspend = async () => {
    if (!selectedSupplier || !suspendReason.trim()) {
      alert('Vui lòng nhập lý do đình chỉ');
      return;
    }

    try {
      setLoading(true);
      await supplierService.suspendSupplier(selectedSupplier.userId, suspendReason);
      alert('Đã đình chỉ nhà cung cấp thành công');
      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedSupplier(null);
      await fetchSuppliers();
    } catch (error: any) {
      alert('Lỗi: ' + (error.message || 'Không thể đình chỉ nhà cung cấp'));
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!selectedSupplier) return;

    try {
      setLoading(true);
      await supplierService.unsuspendSupplier(selectedSupplier.userId);
      alert('Đã gỡ bỏ đình chỉ thành công');
      setShowUnsuspendModal(false);
      setSelectedSupplier(null);
      await fetchSuppliers();
    } catch (error: any) {
      alert('Lỗi: ' + (error.message || 'Không thể gỡ bỏ đình chỉ'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && suppliers.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Danh sách Đối tác</h1>
          <p className="text-gray-600">Tổng số: {totalElements} đối tác</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
            <button
              onClick={fetchSuppliers}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tìm theo tên doanh nghiệp, email, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setStatusFilter(value === 'all' ? undefined : (value as SupplierStatus));
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
                <option value="SUSPENDED">Bị tạm khóa</option>
                <option value="PENDING_APPROVAL">Chờ duyệt</option>
                <option value="REJECTED">Bị từ chối</option>
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
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {debouncedSearch || statusFilter
                ? 'Không tìm thấy đối tác nào phù hợp'
                : 'Chưa có đối tác nào'}
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doanh nghiệp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người đại diện
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số cửa hàng
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
                  {suppliers.map((supplier) => (
                    <tr key={supplier.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={supplier.avatarUrl || 'https://via.placeholder.com/40'}
                            alt={supplier.businessName}
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.businessName}
                            </div>
                            <div className="text-sm text-gray-500">
                              MST: {supplier.taxCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{supplier.fullName}</div>
                        <div className="text-sm text-gray-500">@{supplier.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{supplier.email}</div>
                        <div className="text-sm text-gray-500">{supplier.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.totalStores || 0} cửa hàng
                        </div>
                        <div className="text-sm text-gray-500">
                          {supplier.totalProducts || 0} sản phẩm
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(supplier.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(supplier.userId)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Xem chi tiết
                        </button>
                        {supplier.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleSuspendClick(supplier)}
                            className="text-red-600 hover:text-red-900 mr-3"
                          >
                            Đình chỉ
                          </button>
                        )}
                        {supplier.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleUnsuspendClick(supplier)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Gỡ đình chỉ
                          </button>
                        )}
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
                        <span className="font-medium">
                          {Math.min((page + 1) * size, totalElements)}
                        </span>{' '}
                        trong tổng số <span className="font-medium">{totalElements}</span> đối tác
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
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowSuspendModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Đình chỉ nhà cung cấp
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Đình chỉ <strong>{selectedSupplier.fullName}</strong> ({selectedSupplier.businessName})?
                      </p>
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                        <strong>Lưu ý:</strong> Tất cả hoạt động bán hàng sẽ bị khóa:
                        <ul className="list-disc list-inside mt-1 ml-2">
                          <li>Cửa hàng bị ẩn khỏi tìm kiếm</li>
                          <li>Sản phẩm không hiển thị</li>
                          <li>Không thể truy cập hệ thống</li>
                        </ul>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lý do đình chỉ *
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Nhập lý do đình chỉ (ví dụ: Vi phạm chính sách, Sản phẩm giả...)"
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSuspend}
                  disabled={loading || !suspendReason.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận đình chỉ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspendReason('');
                  }}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsuspend Modal */}
      {showUnsuspendModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowUnsuspendModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Gỡ bỏ đình chỉ
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Gỡ bỏ đình chỉ cho <strong>{selectedSupplier.fullName}</strong> ({selectedSupplier.businessName})?
                      </p>
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                        Nhà cung cấp sẽ được khôi phục hoạt động:
                        <ul className="list-disc list-inside mt-1 ml-2">
                          <li>Cửa hàng hiển thị trở lại</li>
                          <li>Sản phẩm có thể bán</li>
                          <li>Truy cập hệ thống bình thường</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUnsuspend}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận gỡ đình chỉ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUnsuspendModal(false)}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
