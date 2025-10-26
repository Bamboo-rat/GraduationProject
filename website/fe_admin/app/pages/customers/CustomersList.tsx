import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import customerService, { CustomerResponse } from '~/service/customerService';

export default function CustomersList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 20;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [tierFilter, setTierFilter] = useState<string | undefined>(undefined);
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
    fetchCustomers();
  }, [page, statusFilter, tierFilter, debouncedSearch]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.getAllCustomers({
        page,
        size,
        status: statusFilter,
        tier: tierFilter,
        search: debouncedSearch,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
      });
      setCustomers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'Hoạt động', className: 'bg-green-100 text-green-800' },
      PENDING_VERIFICATION: { label: 'Chờ xác thực', className: 'bg-yellow-100 text-yellow-800' },
      SUSPENDED: { label: 'Tạm khóa', className: 'bg-red-100 text-red-800' },
      INACTIVE: { label: 'Ngừng hoạt động', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierConfig: Record<string, { label: string; className: string }> = {
      BRONZE: { label: 'Đồng', className: 'bg-orange-100 text-orange-800' },
      SILVER: { label: 'Bạc', className: 'bg-gray-300 text-gray-800' },
      GOLD: { label: 'Vàng', className: 'bg-yellow-300 text-yellow-900' },
      PLATINUM: { label: 'Bạch kim', className: 'bg-purple-100 text-purple-800' },
    };

    const config = tierConfig[tier] || { label: tier, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${currentActive ? 'tạm khóa' : 'kích hoạt'} khách hàng này?`)) {
      return;
    }

    try {
      await customerService.setActiveStatus(userId, !currentActive);
      fetchCustomers(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleViewDetail = (userId: string) => {
    // Navigate to customer detail page
    navigate(`/customers/${userId}`);
  };

  if (loading && customers.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Danh sách Khách hàng</h1>
          <p className="text-gray-600">Tổng số: {totalElements} khách hàng</p>
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
              onClick={fetchCustomers}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tìm theo tên, email, SĐT..."
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
                  setStatusFilter(value === 'all' ? undefined : value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="ACTIVE">Hoạt động</option>
                <option value="PENDING_VERIFICATION">Chờ xác thực</option>
                <option value="SUSPENDED">Tạm khóa</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hạng thành viên
              </label>
              <select
                value={tierFilter || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setTierFilter(value === 'all' ? undefined : value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="BRONZE">Đồng</option>
                <option value="SILVER">Bạc</option>
                <option value="GOLD">Vàng</option>
                <option value="PLATINUM">Bạch kim</option>
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
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {debouncedSearch || statusFilter || tierFilter
                ? 'Không tìm thấy khách hàng nào phù hợp'
                : 'Chưa có khách hàng nào'}
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điểm tích lũy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hạng
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
                  {customers.map((customer) => (
                    <tr key={customer.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={customer.avatarUrl || 'https://via.placeholder.com/40'}
                            alt={customer.fullName || customer.username}
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.fullName || 'Chưa cập nhật'}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{customer.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.points.toLocaleString('vi-VN')} điểm
                        </div>
                        <div className="text-sm text-gray-500">
                          Tổng: {customer.lifetimePoints.toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTierBadge(customer.tier)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(customer.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(customer.userId)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleToggleActive(customer.userId, customer.active)}
                          className={`${
                            customer.active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {customer.active ? 'Tạm khóa' : 'Kích hoạt'}
                        </button>
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
                        trong tổng số <span className="font-medium">{totalElements}</span> khách hàng
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
    </DashboardLayout>
  );
}
