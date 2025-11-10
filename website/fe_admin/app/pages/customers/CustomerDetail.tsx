import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import customerService, { type CustomerDetailResponse, type ViolationsDiscipline, type BehavioralStatistics, type EvaluationRecommendation } from '~/service/customerService';
import SuspendBanConfirmModal from '~/component/features/SuspendBanConfirmModal';
import Toast, { type ToastType } from '~/component/common/Toast';

export default function CustomerDetail() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [customerDetail, setCustomerDetail] = useState<CustomerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'suspend' | 'ban' | 'activate' | null>(null);

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
      const data = await customerService.getCustomerDetailForAdmin(userId);
      setCustomerDetail(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: 'suspend' | 'ban' | 'activate') => {
    setPendingAction(action);
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    if (!customerDetail || !pendingAction) return;

    try {
      const active = pendingAction === 'activate';
      await customerService.setActiveStatus(customerDetail.basicInfo.userId, active);

      setToast({
        message: `Đã ${
          pendingAction === 'activate' ? 'kích hoạt' :
          pendingAction === 'suspend' ? 'tạm khóa' : 'cấm'
        } tài khoản khách hàng thành công`,
        type: 'success'
      });

      setShowActionModal(false);
      setPendingAction(null);

      // Refresh data
      await fetchCustomerDetail();
    } catch (err: any) {
      setToast({
        message: err.message || 'Không thể cập nhật trạng thái',
        type: 'error'
      });
      setShowActionModal(false);
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowActionModal(false);
    setPendingAction(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'Hoạt động', className: 'bg-green-100 text-green-800' },
      PENDING_VERIFICATION: { label: 'Chờ xác thực', className: 'bg-yellow-100 text-yellow-800' },
      SUSPENDED: { label: 'Tạm khóa', className: 'bg-red-100 text-red-800' },
      BANNED: { label: 'Cấm', className: 'bg-red-600 text-white' },
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
      DIAMOND: { label: 'Kim cương', className: 'bg-blue-100 text-blue-800' },
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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

  if (error || !customerDetail) {
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
              onClick={() => navigate('/customers/list-customers')}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Quay lại
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { basicInfo, activityHistory, violationsDiscipline, behavioralStatistics, evaluationRecommendation } = customerDetail;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/customers/list-customers')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Chi tiết Khách hàng</h1>
              <p className="text-gray-600">@{basicInfo.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {basicInfo.status === 'ACTIVE' && (
              <>
                <button
                  onClick={() => handleActionClick('suspend')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
                >
                  Tạm khóa
                </button>
                <button
                  onClick={() => handleActionClick('ban')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  Cấm tài khoản
                </button>
              </>
            )}
            {basicInfo.status === 'SUSPENDED' && (
              <button
                onClick={() => handleActionClick('activate')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Kích hoạt lại
              </button>
            )}
            {basicInfo.status === 'BANNED' && (
              <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium text-center">
                Tài khoản đã bị cấm vĩnh viễn
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                <img
                  src={basicInfo.avatarUrl || 'https://via.placeholder.com/150'}
                  alt={basicInfo.fullName || basicInfo.username}
                  className="w-32 h-32 rounded-full mx-auto object-cover mb-4"
                />
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {basicInfo.fullName || 'Chưa cập nhật'}
                </h2>
                <div className="flex items-center justify-center space-x-2 mb-3">
                  {getStatusBadge(basicInfo.status)}
                  {getTierBadge(basicInfo.tier)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{basicInfo.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p className="text-gray-900">{basicInfo.phoneNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày sinh</label>
                  <p className="text-gray-900">
                    {basicInfo.dateOfBirth
                      ? new Date(basicInfo.dateOfBirth).toLocaleDateString('vi-VN')
                      : 'Chưa cập nhật'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày đăng ký</label>
                  <p className="text-gray-900">{formatDate(basicInfo.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Đăng nhập lần cuối</label>
                  <p className="text-gray-900">{formatDate(basicInfo.lastLoginAt)}</p>
                </div>
              </div>
            </div>

            {/* Automated Risk Assessment */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                <span>Đánh giá tự động</span>
                <span 
                  className="text-gray-400 hover:text-gray-600 cursor-help transition-colors" 
                  title="Hệ thống đánh giá dựa trên quy tắc phân tích hành vi: tỷ lệ hủy đơn, trả hàng, vi phạm, điểm tích lũy, v.v. Không sử dụng mô hình AI/Machine Learning."
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Khuyến nghị:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    evaluationRecommendation.recommendation === 'BAN' ? 'bg-red-100 text-red-800' :
                    evaluationRecommendation.recommendation === 'SUSPEND' ? 'bg-orange-100 text-orange-800' :
                    evaluationRecommendation.recommendation === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {evaluationRecommendation.recommendation === 'BAN' ? 'Cấm' :
                     evaluationRecommendation.recommendation === 'SUSPEND' ? 'Tạm khóa' :
                     evaluationRecommendation.recommendation === 'WARN' ? 'Cảnh báo' : 'Cho phép'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Độ tin cậy: </span>
                  <span className="font-bold text-blue-600">{evaluationRecommendation.confidenceScore}%</span>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-sm text-gray-700">{evaluationRecommendation.reason}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Points & Tier Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Điểm tích lũy & Hạng thành viên</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Điểm hiện tại</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {basicInfo.currentPoints.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Tổng điểm tích lũy</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {basicInfo.lifetimePoints.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Điểm năm nay</p>
                  <p className="text-2xl font-bold text-green-600">
                    {basicInfo.pointsThisYear.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Điểm đến hạng kế</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {basicInfo.pointsToNextTier.toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Behavioral Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Thống kê hành vi
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{behavioralStatistics.totalOrders}</div>
                  <div className="text-xs text-gray-600">Tổng đơn</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{behavioralStatistics.completedOrders}</div>
                  <div className="text-xs text-gray-600">Hoàn thành</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{behavioralStatistics.canceledOrders}</div>
                  <div className="text-xs text-gray-600">Hủy ({behavioralStatistics.cancellationRate.toFixed(1)}%)</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">{behavioralStatistics.returnedOrders}</div>
                  <div className="text-xs text-gray-600">Trả ({behavioralStatistics.returnRate.toFixed(1)}%)</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-sm text-gray-600 mb-1">Tổng giá trị đơn hàng</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(behavioralStatistics.totalOrderValue)}
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded">
                  <div className="text-sm text-gray-600 mb-1">Điểm rủi ro</div>
                  <div className={`text-xl font-bold ${
                    behavioralStatistics.riskScore >= 70 ? 'text-red-600' :
                    behavioralStatistics.riskScore >= 50 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {behavioralStatistics.riskScore}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Violations Summary */}
            {violationsDiscipline.totalViolations > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Tổng quan vi phạm
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-2xl font-bold text-red-600">{violationsDiscipline.totalViolations}</div>
                    <div className="text-xs text-gray-600">Tổng vi phạm</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">{violationsDiscipline.activeWarningsCount}</div>
                    <div className="text-xs text-gray-600">Cảnh báo</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">{violationsDiscipline.totalSuspensions}</div>
                    <div className="text-xs text-gray-600">Lịch sử khóa</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-gray-900">{violationsDiscipline.violationPoints}</div>
                    <div className="text-xs text-gray-600">Điểm vi phạm</div>
                  </div>
                </div>

                {violationsDiscipline.isCurrentlySuspended && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Tài khoản đang bị tạm khóa đến: {formatDate(violationsDiscipline.currentSuspensionEndsAt)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Orders */}
            {activityHistory.recentOrders.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Đơn hàng gần đây</h3>
                <div className="space-y-3">
                  {activityHistory.recentOrders.slice(0, 5).map((order) => (
                    <div key={order.orderId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderCode}</p>
                        <p className="text-sm text-gray-600">{order.storeName}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.wasCanceled ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suspend/Ban Confirmation Modal */}
      <SuspendBanConfirmModal
        show={showActionModal}
        action={pendingAction}
        customerName={basicInfo.fullName || basicInfo.username}
        violations={violationsDiscipline}
        statistics={behavioralStatistics}
        recommendation={evaluationRecommendation}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}
