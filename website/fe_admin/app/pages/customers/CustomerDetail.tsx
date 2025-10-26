import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import customerService, { CustomerResponse } from '~/service/customerService';

export default function CustomerDetail() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchCustomerDetail();
    }
  }, [userId]);

  const fetchCustomerDetail = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomerById(userId);
      setCustomer(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!customer) return;

    if (!confirm(`Bạn có chắc muốn ${customer.active ? 'tạm khóa' : 'kích hoạt'} khách hàng này?`)) {
      return;
    }

    try {
      const updated = await customerService.setActiveStatus(customer.userId, !customer.active);
      setCustomer(updated);
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
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

  if (error || !customer) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error || 'Không tìm thấy khách hàng'}
            </div>
            <button
              onClick={() => navigate('/customers/list')}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Quay lại
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/customers/list')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Chi tiết Khách hàng</h1>
              <p className="text-gray-600">@{customer.username}</p>
            </div>
          </div>
          <button
            onClick={handleToggleActive}
            className={`px-4 py-2 rounded-lg font-medium ${
              customer.active
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {customer.active ? 'Tạm khóa tài khoản' : 'Kích hoạt tài khoản'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <img
                  src={customer.avatarUrl || 'https://via.placeholder.com/150'}
                  alt={customer.fullName || customer.username}
                  className="w-32 h-32 rounded-full mx-auto object-cover mb-4"
                />
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {customer.fullName || 'Chưa cập nhật'}
                </h2>
                <div className="flex items-center justify-center space-x-2 mb-3">
                  {getStatusBadge(customer.status)}
                  {getTierBadge(customer.tier)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p className="text-gray-900">{customer.phoneNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày sinh</label>
                  <p className="text-gray-900">
                    {customer.dateOfBirth
                      ? new Date(customer.dateOfBirth).toLocaleDateString('vi-VN')
                      : 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày đăng ký</label>
                  <p className="text-gray-900">{formatDate(customer.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cập nhật lần cuối</label>
                  <p className="text-gray-900">{formatDate(customer.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Points & Tier Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Điểm tích lũy & Hạng thành viên</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Điểm hiện tại</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {customer.points.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Tổng điểm tích lũy</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {customer.lifetimePoints.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Điểm năm nay</p>
                  <p className="text-2xl font-bold text-green-600">
                    {customer.pointsThisYear.toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              {customer.tierUpdatedAt && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Hạng thành viên được cập nhật lần cuối:{' '}
                    <span className="font-medium">{formatDate(customer.tierUpdatedAt)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Trạng thái tài khoản</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        customer.active ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <span className="text-gray-700">Trạng thái hoạt động</span>
                  </div>
                  <span className="font-medium">{customer.active ? 'Đang hoạt động' : 'Tạm khóa'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Trạng thái xác thực</span>
                  {getStatusBadge(customer.status)}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Hạng thành viên</span>
                  {getTierBadge(customer.tier)}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Thao tác nhanh</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">Xem lịch sử đơn hàng</div>
                  <div className="text-sm text-gray-500">Danh sách đơn hàng đã đặt</div>
                </button>
                <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">Xem lịch sử giao dịch</div>
                  <div className="text-sm text-gray-500">Giao dịch thanh toán</div>
                </button>
                <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">Xem điểm tích lũy</div>
                  <div className="text-sm text-gray-500">Lịch sử tích điểm</div>
                </button>
                <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">Xem đánh giá</div>
                  <div className="text-sm text-gray-500">Đánh giá sản phẩm</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
