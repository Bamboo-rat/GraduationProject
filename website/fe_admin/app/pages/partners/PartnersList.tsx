import { useState, useEffect } from 'react';
import { useNavigate, useLoaderData, useSearchParams } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import supplierService  from '~/service/supplierService';
import type { Supplier, SupplierStatus } from '~/service/supplierService';
import SupplierSuspendModal from '~/component/features/SupplierSuspendModal';
import Toast, { type ToastType } from '~/component/common/Toast';

export default function PartnersList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get data from React Router 7 loader (loaded BEFORE navigation)
  const loaderData = useLoaderData() as {
    suppliers: Supplier[];
    totalPages: number;
    totalElements: number;
    initialPage: number;
    initialStatus?: string;
    initialSearch: string;
    error?: string;
  };

  // Initialize state from loader data
  const [suppliers, setSuppliers] = useState<Supplier[]>(loaderData.suppliers);
  const [totalPages, setTotalPages] = useState(loaderData.totalPages);
  const [totalElements, setTotalElements] = useState(loaderData.totalElements);
  const [error, setError] = useState<string | null>(loaderData.error || null);

  // Filters - initialize from URL params
  const [searchTerm, setSearchTerm] = useState(loaderData.initialSearch);
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | undefined>(
    loaderData.initialStatus as SupplierStatus | undefined
  );
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Suspend modal state
  const [suspendModal, setSuspendModal] = useState<{
    show: boolean;
    action: 'suspend' | 'activate' | null;
    supplier: Supplier | null;
  }>({
    show: false,
    action: null,
    supplier: null,
  });

  const size = 20;
  const page = loaderData.initialPage;

  // Update state when loader data changes (on navigation)
  useEffect(() => {
    setSuppliers(loaderData.suppliers);
    setTotalPages(loaderData.totalPages);
    setTotalElements(loaderData.totalElements);
    setError(loaderData.error || null);
  }, [loaderData]);

  // Debounced search - updates URL params which triggers loader
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', '0'); // Reset to first page
      setSearchParams(params);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update URL when filters change
  const updateFilters = (newStatus?: SupplierStatus, newPage: number = 0) => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (newStatus) params.set('status', newStatus);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const getStatusBadge = (status: SupplierStatus) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${supplierService.getStatusColorClass(status)}`}>
        {supplierService.getStatusLabel(status)}
      </span>
    );
  };

  const handleViewDetail = (supplierId: string) => {
    navigate(`/partners/${supplierId}`);
  };

  const handleOpenSuspendModal = (supplier: Supplier) => {
    const action = supplier.status === 'SUSPENDED' ? 'activate' : 'suspend';
    setSuspendModal({
      show: true,
      action,
      supplier,
    });
  };

  const handleConfirmSuspend = async (reason?: string) => {
    if (!suspendModal.supplier || !suspendModal.action) return;

    try {
      if (suspendModal.action === 'suspend') {
        if (!reason) {
          setToast({
            message: 'Vui lòng nhập lý do đình chỉ nhà cung cấp',
            type: 'error'
          });
          return;
        }
        await supplierService.suspendSupplier(suspendModal.supplier.userId, reason);
        setToast({
          message: 'Đã đình chỉ nhà cung cấp thành công',
          type: 'success'
        });
      } else if (suspendModal.action === 'activate') {
        await supplierService.unsuspendSupplier(suspendModal.supplier.userId);
        setToast({
          message: 'Đã gỡ bỏ đình chỉ thành công',
          type: 'success'
        });
      }

      setSuspendModal({
        show: false,
        action: null,
        supplier: null,
      });
      // Trigger loader refresh by navigating to current URL
      window.location.reload();
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái',
        type: 'error'
      });
    }
  };

  const handleCancelSuspend = () => {
    setSuspendModal({
      show: false,
      action: null,
      supplier: null,
    });
  };

  // No initial loading spinner needed - loader handles it!
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
              onClick={() => window.location.reload()}
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
                  const newStatus = value === 'all' ? undefined : (value as SupplierStatus);
                  setStatusFilter(newStatus);
                  updateFilters(newStatus, 0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="PAUSE">Ngừng hoạt động</option>
                <option value="SUSPENDED">Bị tạm khóa</option>
                <option value="PENDING_APPROVAL">Chờ duyệt</option>
                <option value="REJECTED">Bị từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {suppliers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || statusFilter
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
                            onClick={() => handleOpenSuspendModal(supplier)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Đình chỉ
                          </button>
                        )}
                        {supplier.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleOpenSuspendModal(supplier)}
                            className="text-green-600 hover:text-green-900"
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
                      onClick={() => updateFilters(statusFilter, Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => updateFilters(statusFilter, Math.min(totalPages - 1, page + 1))}
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
                          onClick={() => updateFilters(statusFilter, Math.max(0, page - 1))}
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
                              onClick={() => updateFilters(statusFilter, pageNumber)}
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
                          onClick={() => updateFilters(statusFilter, Math.min(totalPages - 1, page + 1))}
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

      {/* Supplier Suspend/Activate Modal */}
      {suspendModal.show && suspendModal.supplier && (
        <SupplierSuspendModal
          show={suspendModal.show}
          action={suspendModal.action}
          supplierName={suspendModal.supplier.fullName}
          supplierBusinessName={suspendModal.supplier.businessName}
          supplierEmail={suspendModal.supplier.email}
          supplierPhone={suspendModal.supplier.phoneNumber}
          onConfirm={handleConfirmSuspend}
          onCancel={handleCancelSuspend}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </DashboardLayout>
  );
}
