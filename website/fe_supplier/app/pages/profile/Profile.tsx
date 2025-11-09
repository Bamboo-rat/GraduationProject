import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import supplierService from '~/service/supplierService';
import type { SupplierResponse } from '~/service/supplierService';
import { Building2, Mail, Phone, MapPin, Briefcase, CreditCard, Store, Package, TrendingUp, Edit, FileText, User as UserIcon, Calendar, DollarSign, PauseCircle, PlayCircle } from 'lucide-react';
import AvatarUpload from '~/component/common/AvatarUpload';
import ProfileUpdateModal from '~/component/features/profile/ProfileUpdateModal';
import BusinessInfoUpdateModal from '~/component/features/profile/BusinessInfoUpdateModal';
import Toast, { type ToastType } from '~/component/common/Toast';

export default function Profile() {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  // Modal states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSupplierInfo();
  }, []);

  const fetchSupplierInfo = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getCurrentSupplier();
      setSupplier(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (url: string) => {
    try {
      // Update avatar on backend
      await supplierService.updateProfile({ avatarUrl: url });

      // Refresh supplier info to show new avatar
      await fetchSupplierInfo();

      setToast({ type: 'success', message: 'Cập nhật ảnh đại diện thành công!' });
    } catch (err: any) {
      console.error('Error updating avatar:', err);
      setToast({ type: 'error', message: err.message || 'Không thể cập nhật ảnh đại diện' });
    }
  };

  const handlePauseOperations = async () => {
    if (!pauseReason.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập lý do tạm dừng' });
      return;
    }

    try {
      setActionLoading(true);
      await supplierService.pauseOperations(pauseReason);
      setToast({ type: 'success', message: 'Đã tạm dừng hoạt động thành công!' });
      setIsPauseModalOpen(false);
      setPauseReason('');
      await fetchSupplierInfo();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Không thể tạm dừng hoạt động' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeOperations = async () => {
    try {
      setActionLoading(true);
      await supplierService.resumeOperations();
      setToast({ type: 'success', message: 'Đã tiếp tục hoạt động thành công!' });
      setIsResumeModalOpen(false);
      await fetchSupplierInfo();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Không thể tiếp tục hoạt động' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      ACTIVE: { label: 'Hoạt động', class: 'badge-success' },
      PENDING_APPROVAL: { label: 'Chờ duyệt', class: 'badge-warning' },
      SUSPENDED: { label: 'Bị đình chỉ', class: 'badge-error' },
      PAUSE: { label: 'Tạm dừng', class: 'badge-warning' },
      REJECTED: { label: 'Bị từ chối', class: 'badge-neutral' },
    };
    const config = statusConfig[status] || { label: status, class: 'badge-neutral' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getBusinessTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      SUPERMARKET: 'Siêu thị',
      CONVENIENCE_STORE: 'Cửa hàng tiện lợi',
      GROCERY_STORE: 'Cửa hàng tạp hóa',
      DISTRIBUTOR: 'Nhà phân phối',
      RESTAURANT: 'Nhà hàng',
      BAKERY: 'Tiệm bánh',
      COFFEE_SHOP: 'Quán cà phê',
      OTHER: 'Khác',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="p-6">
        <div className="border border-accent-red bg-red-50 text-accent-red px-4 py-3 rounded-lg animate-scaleIn">
          {error || 'Không thể tải thông tin nhà cung cấp'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <AvatarUpload
            currentAvatarUrl={supplier.avatarUrl}
            onAvatarChange={handleAvatarChange}
            userName={supplier.businessName}
            size="large"
            editable={true}
          />
          <div>
            <h1 className="heading-primary">{supplier.businessName}</h1>
            <p className="text-muted mt-1">Nhà cung cấp: {supplier.fullName}</p>
            <div className="mt-2">{getStatusBadge(supplier.status)}</div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/store/update-history')}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText size={18} />
            Lịch sử cập nhật
          </button>

          {/* Pause/Resume Operations Button */}
          {supplier.status === 'ACTIVE' && (
            <button
              onClick={() => setIsPauseModalOpen(true)}
              className="btn-warning flex items-center gap-2"
              disabled={actionLoading}
            >
              <PauseCircle size={18} />
              Tạm dừng hoạt động
            </button>
          )}

          {supplier.status === 'PAUSE' && (
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="btn-success flex items-center gap-2"
              disabled={actionLoading}
            >
              <PlayCircle size={18} />
              Tiếp tục hoạt động
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Số dư ví</p>
              <p className="text-2xl font-bold text-secondary">
                {supplier.wallet ? formatCurrency(supplier.wallet.availableBalance) : formatCurrency(0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#E8FFED] rounded-full flex items-center justify-center">
              <CreditCard size={24} className="text-secondary" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Tổng cửa hàng</p>
              <p className="text-2xl font-bold text-primary">{supplier.totalStores ?? 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary-lighter rounded-full flex items-center justify-center">
              <Store size={24} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-accent-warm">{supplier.totalProducts ?? 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <Package size={24} className="text-accent-warm" />
            </div>
          </div>
        </div>

        <div className="card p-6 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Doanh thu tháng</p>
              <p className="text-2xl font-bold text-[#2F855A]">
                {supplier.wallet ? formatCurrency(supplier.wallet.monthlyEarnings) : formatCurrency(0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#E8FFED] rounded-full flex items-center justify-center">
              <TrendingUp size={24} className="text-[#2F855A]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information Card */}
        <div className="card p-6 border-l-4 border-l-primary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-secondary flex items-center gap-2">
              <UserIcon size={20} className="text-primary" />
              Thông tin cá nhân
            </h2>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Edit size={16} />
              Cập nhật
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <UserIcon size={18} className="text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted">Họ và tên</p>
                <p className="font-medium text-text">{supplier.fullName || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="text-muted flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted">Email</p>
                <p className="font-medium text-text">{supplier.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="text-muted flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted">Số điện thoại</p>
                <p className="font-medium text-text">{supplier.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted">Địa chỉ kinh doanh</p>
                <p className="font-medium text-text">{supplier.businessAddress || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-default">
              <p className="text-sm text-muted mb-3">Thông tin hệ thống</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-light">Username</p>
                  <p className="font-medium text-text text-sm">{supplier.username}</p>
                </div>
                <div>
                  <p className="text-xs text-light">Ngày tham gia</p>
                  <p className="font-medium text-text text-sm flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(supplier.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
         
        </div>

        {/* Business Information Card */}
        <div className="card p-6 border-l-4 border-l-secondary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-secondary flex items-center gap-2">
              <Briefcase size={20} className="text-secondary" />
              Thông tin doanh nghiệp
            </h2>
            <button
              onClick={() => setIsBusinessModalOpen(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <FileText size={16} />
              Yêu cầu cập nhật
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 size={18} className="text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted">Tên doanh nghiệp</p>
                <p className="font-medium text-text">{supplier.businessName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 size={18} className="text-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted">Loại hình kinh doanh</p>
                <p className="font-medium text-text">{getBusinessTypeLabel(supplier.businessType)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted">Mã số thuế</p>
                <p className="font-medium text-text">{supplier.taxCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Giấy phép ĐKKD</p>
                <p className="font-medium text-text">{supplier.businessLicense}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted">Chứng nhận ATTP</p>
              <p className="font-medium text-text">{supplier.foodSafetyCertificate || 'Chưa có'}</p>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-muted" />
              <div>
                <p className="text-sm text-muted">Tỷ lệ hoa hồng</p>
                <p className="font-medium text-text">
                  {supplier.commissionRate !== null ? `${(supplier.commissionRate * 100).toFixed(1)}%` : 'Chưa thiết lập'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-default">
              <p className="text-sm text-muted mb-2">Cập nhật lần cuối</p>
              <p className="font-medium text-text text-sm flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(supplier.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stores List */}
      {supplier.stores && supplier.stores.length > 0 ? (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-secondary flex items-center gap-2">
              <Store size={20} className="text-primary" />
              Cửa hàng của tôi ({supplier.stores.length})
            </h2>
            <button
              onClick={() => navigate('/store/list')}
              className="btn-secondary text-sm"
            >
              Xem tất cả
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplier.stores.map((store) => (
              <div
                key={store.storeId}
                className="border border-default rounded-lg p-4 card-hover cursor-pointer bg-surface"
                onClick={() => navigate(`/store/profile?storeId=${store.storeId}`)}
              >
                <h3 className="font-semibold text-text mb-2">{store.storeName}</h3>
                <p className="text-sm text-muted mb-2 line-clamp-2">{store.address}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">{store.phoneNumber}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    store.status === 'ACTIVE' ? 'badge-success' :
                    store.status === 'PENDING' ? 'badge-warning' :
                    'badge-neutral'
                  }`}>
                    {store.status === 'ACTIVE' ? 'Hoạt động' : 
                     store.status === 'PENDING' ? 'Chờ duyệt' : 
                     store.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="text-center py-8">
            <Store size={48} className="text-light mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Chưa có cửa hàng</h3>
            <p className="text-muted mb-4">Bạn chưa tạo cửa hàng nào</p>
            <button
              onClick={() => navigate('/store/create')}
              className="btn-primary"
            >
              Tạo cửa hàng đầu tiên
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-6 bg-surface-light border border-default">
        <h2 className="heading-secondary mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/products/list')}
            className="bg-surface hover:bg-surface-light rounded-lg p-4 flex flex-col items-center gap-2 transition-all border border-default card-hover"
          >
            <Package size={24} className="text-primary" />
            <span className="text-sm font-medium text-text">Quản lý sản phẩm</span>
          </button>
          <button
            onClick={() => navigate('/store/list')}
            className="bg-surface hover:bg-surface-light rounded-lg p-4 flex flex-col items-center gap-2 transition-all border border-default card-hover"
          >
            <Store size={24} className="text-primary" />
            <span className="text-sm font-medium text-text">Quản lý cửa hàng</span>
          </button>
          <button
            onClick={() => navigate('/finance/revenue')}
            className="bg-surface hover:bg-surface-light rounded-lg p-4 flex flex-col items-center gap-2 transition-all border border-default card-hover"
          >
            <TrendingUp size={24} className="text-secondary" />
            <span className="text-sm font-medium text-text">Doanh thu</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {supplier && (
        <>
          <ProfileUpdateModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            onSuccess={fetchSupplierInfo}
            currentSupplier={supplier}
          />
          <BusinessInfoUpdateModal
            isOpen={isBusinessModalOpen}
            onClose={() => setIsBusinessModalOpen(false)}
            onSuccess={fetchSupplierInfo}
          />
        </>
      )}

      {/* Pause Operations Modal */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Xác nhận tạm dừng hoạt động</h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Khi tạm dừng hoạt động:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Cửa hàng sẽ bị ẩn khỏi tìm kiếm công khai</li>
                    <li>Không nhận đơn hàng mới</li>
                    <li>Vẫn có quyền truy cập backend để chuẩn bị dữ liệu</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do tạm dừng <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Nhập lý do tạm dừng (ví dụ: Chuẩn bị hàng hóa, Nghỉ lễ, Nâng cấp cơ sở...)"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsPauseModalOpen(false);
                  setPauseReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                onClick={handlePauseOperations}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading || !pauseReason.trim()}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận tạm dừng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Operations Modal */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Xác nhận tiếp tục hoạt động</h3>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Khi tiếp tục hoạt động:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Cửa hàng và sản phẩm sẽ được hiển thị trở lại ngay lập tức</li>
                    <li>Bắt đầu nhận đơn hàng mới</li>
                    <li>Tất cả chức năng được kích hoạt lại</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn tiếp tục hoạt động kinh doanh?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsResumeModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleResumeOperations}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận tiếp tục'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}