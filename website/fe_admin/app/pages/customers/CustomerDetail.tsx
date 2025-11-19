import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import customerService, { type CustomerDetailResponse, type ViolationsDiscipline, type BehavioralStatistics, type EvaluationRecommendation } from '~/service/customerService';
import SuspendBanConfirmModal from '~/component/features/SuspendBanConfirmModal';
import Toast, { type ToastType } from '~/component/common/Toast';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Shield,
  Ban,
  PlayCircle,
  Star,
  DollarSign,
  AlertCircle
} from 'lucide-react';

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
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      ACTIVE: { 
        label: 'Hoạt động', 
        className: 'bg-green-100 text-green-800 border border-green-200',
        icon: <CheckCircle className="w-4 h-4" />
      },
      PENDING_VERIFICATION: { 
        label: 'Chờ xác thực', 
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        icon: <Clock className="w-4 h-4" />
      },
      SUSPENDED: { 
        label: 'Tạm khóa', 
        className: 'bg-orange-100 text-orange-800 border border-orange-200',
        icon: <Ban className="w-4 h-4" />
      },
      BANNED: { 
        label: 'Cấm', 
        className: 'bg-red-100 text-red-800 border border-red-200',
        icon: <Shield className="w-4 h-4" />
      },
      INACTIVE: { 
        label: 'Ngừng hoạt động', 
        className: 'bg-gray-100 text-gray-800 border border-gray-200',
        icon: <XCircle className="w-4 h-4" />
      },
    };

    const config = statusConfig[status] || { 
      label: status, 
      className: 'bg-gray-100 text-gray-800 border border-gray-200',
      icon: <User className="w-4 h-4" />
    };

    return (
      <span className={`px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierConfig: Record<string, { label: string; className: string }> = {
      BRONZE: { label: 'Đồng', className: 'bg-orange-100 text-orange-800 border border-orange-200' },
      SILVER: { label: 'Bạc', className: 'bg-gray-100 text-gray-800 border border-gray-300' },
      GOLD: { label: 'Vàng', className: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
      PLATINUM: { label: 'Bạch kim', className: 'bg-purple-100 text-purple-800 border border-purple-200' },
      DIAMOND: { label: 'Kim cương', className: 'bg-blue-100 text-blue-800 border border-blue-200' },
    };

    const config = tierConfig[tier] || { label: tier, className: 'bg-gray-100 text-gray-800 border border-gray-200' };

    return (
      <span className={`px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${config.className}`}>
        <Award className="w-4 h-4" />
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
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F855A] mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin khách hàng...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !customerDetail) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-red-600 mb-4">{error || 'Không tìm thấy khách hàng'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/customers/list-customers')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Quay lại danh sách
              </button>
              <button
                onClick={fetchCustomerDetail}
                className="px-4 py-2 bg-[#2F855A] text-white rounded-lg hover:bg-[#276749] font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { basicInfo, activityHistory, violationsDiscipline, behavioralStatistics, evaluationRecommendation } = customerDetail;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customers/list-customers')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chi tiết Khách hàng</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <User className="w-4 h-4" />
                @{basicInfo.username}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {basicInfo.status === 'ACTIVE' && (
              <>
                <button
                  onClick={() => handleActionClick('suspend')}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  Tạm khóa
                </button>
                <button
                  onClick={() => handleActionClick('ban')}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Cấm tài khoản
                </button>
              </>
            )}
            {basicInfo.status === 'SUSPENDED' && (
              <button
                onClick={() => handleActionClick('activate')}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Kích hoạt lại
              </button>
            )}
            {basicInfo.status === 'BANNED' && (
              <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium flex items-center gap-2 border border-red-200">
                <Shield className="w-4 h-4" />
                Tài khoản đã bị cấm vĩnh viễn
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={basicInfo.avatarUrl || 'https://via.placeholder.com/150'}
                    alt={basicInfo.fullName || basicInfo.username}
                    className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-gray-100"
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    {getStatusBadge(basicInfo.status)}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {basicInfo.fullName || 'Chưa cập nhật'}
                </h2>
                <div className="flex justify-center">
                  {getTierBadge(basicInfo.tier)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{basicInfo.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{basicInfo.phoneNumber}</p>
                    <p className="text-xs text-gray-500">Số điện thoại</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {basicInfo.dateOfBirth
                        ? new Date(basicInfo.dateOfBirth).toLocaleDateString('vi-VN')
                        : 'Chưa cập nhật'}
                    </p>
                    <p className="text-xs text-gray-500">Ngày sinh</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(basicInfo.createdAt)}</p>
                    <p className="text-xs text-gray-500">Ngày đăng ký</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(basicInfo.lastLoginAt)}</p>
                    <p className="text-xs text-gray-500">Đăng nhập lần cuối</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Points & Tier Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#2F855A]" />
                Điểm tích lũy & Hạng thành viên
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Điểm hiện tại</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {basicInfo.currentPoints.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-medium text-purple-900">Tổng điểm tích lũy</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {basicInfo.lifetimePoints.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Điểm năm nay</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {basicInfo.pointsThisYear.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-900">Điểm đến hạng kế</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {basicInfo.pointsToNextTier.toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            {/* Behavioral Statistics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2F855A]" />
                Thống kê Hành vi Mua hàng
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <ShoppingCart className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-gray-900">{behavioralStatistics.totalOrders}</div>
                  <div className="text-xs text-gray-600">Tổng đơn</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-600">{behavioralStatistics.completedOrders}</div>
                  <div className="text-xs text-gray-600">Hoàn thành</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-red-600">{behavioralStatistics.canceledOrders}</div>
                  <div className="text-xs text-gray-600">Hủy ({behavioralStatistics.cancellationRate.toFixed(1)}%)</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <RefreshCw className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-orange-600">{behavioralStatistics.returnedOrders}</div>
                  <div className="text-xs text-gray-600">Trả ({behavioralStatistics.returnRate.toFixed(1)}%)</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div className="text-sm font-medium text-blue-900">Tổng giá trị đơn hàng</div>
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(behavioralStatistics.totalOrderValue)}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-purple-600" />
                    <div className="text-sm font-medium text-purple-900">Điểm rủi ro</div>
                  </div>
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Tổng quan Vi phạm & Kỷ luật
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-red-600">{violationsDiscipline.totalViolations}</div>
                    <div className="text-xs text-gray-600">Tổng vi phạm</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-orange-600">{violationsDiscipline.activeWarningsCount}</div>
                    <div className="text-xs text-gray-600">Cảnh báo</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <Ban className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-purple-600">{violationsDiscipline.totalSuspensions}</div>
                    <div className="text-xs text-gray-600">Lịch sử khóa</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">{violationsDiscipline.violationPoints}</div>
                    <div className="text-xs text-gray-600">Điểm vi phạm</div>
                  </div>
                </div>

                {violationsDiscipline.isCurrentlySuspended && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Ban className="w-5 h-5 text-red-600" />
                      <p className="text-sm font-medium text-red-800">
                        Tài khoản đang bị tạm khóa đến: {formatDate(violationsDiscipline.currentSuspensionEndsAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Orders */}
            {activityHistory.recentOrders.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#2F855A]" />
                  Đơn hàng Gần đây
                </h3>
                <div className="space-y-3">
                  {activityHistory.recentOrders.slice(0, 5).map((order) => (
                    <div key={order.orderId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.orderCode}</p>
                        <p className="text-sm text-gray-600">{order.storeName}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ml-auto ${
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.wasCanceled ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status === 'DELIVERED' ? <CheckCircle className="w-3 h-3" /> :
                           order.wasCanceled ? <XCircle className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
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