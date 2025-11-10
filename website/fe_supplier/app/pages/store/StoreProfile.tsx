import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import storeService from '~/service/storeService';
import type { StoreResponse, StoreStatus } from '~/service/storeService';
import { MapPin, Phone, Mail, Clock, Calendar, Edit, ArrowLeft, Store, AlertCircle, CheckCircle, XCircle, Settings } from 'lucide-react';
import Toast from '~/component/common/Toast';

export default function StoreProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');

  const [store, setStore] = useState<StoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status management
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StoreStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  useEffect(() => {
    if (storeId) {
      fetchStoreData();
    } else {
      setError('Không tìm thấy ID cửa hàng');
      setLoading(false);
    }
  }, [storeId]);

  const fetchStoreData = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      const data = await storeService.getStoreById(storeId);
      setStore(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status?: string) => {
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${storeService.getStatusColorClass(status as any)}`}>
        {storeService.getStatusLabel(status as any)}
      </span>
    );
  };

  const openStatusModal = (newStatus: StoreStatus) => {
    setSelectedStatus(newStatus);
    setStatusReason('');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!store || !selectedStatus) return;

    // Validate reason for some transitions
    if ((selectedStatus === 'TEMPORARILY_CLOSED' || selectedStatus === 'PERMANENTLY_CLOSED') && !statusReason.trim()) {
      setToast({ message: 'Vui lòng nhập lý do', type: 'warning' });
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const updatedStore = await storeService.updateStoreStatus(
        store.storeId,
        selectedStatus,
        statusReason.trim() || undefined
      );

      setStore(updatedStore);
      setShowStatusModal(false);
      setToast({ 
        message: `Đã cập nhật trạng thái cửa hàng thành "${storeService.getStatusLabel(selectedStatus)}"`, 
        type: 'success' 
      });
    } catch (err: any) {
      setToast({ 
        message: err.message || 'Không thể cập nhật trạng thái cửa hàng', 
        type: 'error' 
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getAvailableStatusTransitions = (): Array<{ status: StoreStatus; label: string; icon: any; color: string }> => {
    if (!store) return [];

    const currentStatus = store.status as StoreStatus;

    switch (currentStatus) {
      case 'ACTIVE':
        return [
          { status: 'TEMPORARILY_CLOSED', label: 'Tạm đóng cửa', icon: XCircle, color: 'bg-orange-600 hover:bg-orange-700' },
          { status: 'UNDER_MAINTENANCE', label: 'Chế độ bảo trì', icon: Settings, color: 'bg-blue-600 hover:bg-blue-700' },
          { status: 'PERMANENTLY_CLOSED', label: 'Đóng cửa vĩnh viễn', icon: AlertCircle, color: 'bg-gray-700 hover:bg-gray-800' },
        ];

      case 'TEMPORARILY_CLOSED':
        return [
          { status: 'ACTIVE', label: 'Mở cửa trở lại', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
          { status: 'UNDER_MAINTENANCE', label: 'Chuyển sang bảo trì', icon: Settings, color: 'bg-blue-600 hover:bg-blue-700' },
          { status: 'PERMANENTLY_CLOSED', label: 'Đóng cửa vĩnh viễn', icon: AlertCircle, color: 'bg-gray-700 hover:bg-gray-800' },
        ];

      case 'UNDER_MAINTENANCE':
        return [
          { status: 'ACTIVE', label: 'Hoàn tất bảo trì', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
          { status: 'TEMPORARILY_CLOSED', label: 'Tạm đóng cửa', icon: XCircle, color: 'bg-orange-600 hover:bg-orange-700' },
        ];

      case 'PENDING':
      case 'REJECTED':
      case 'SUSPENDED':
      case 'PERMANENTLY_CLOSED':
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin cửa hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Không thể tải thông tin cửa hàng'}
        </div>
        <button
          onClick={() => navigate('/store/list')}
          className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/store/list')}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại danh sách
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{store.storeName}</h1>
            <div className="flex items-center space-x-3">
              {getStatusBadge(store.status)}
            </div>
          </div>
          {store.status !== 'REJECTED' && (
            <button
              onClick={() => navigate(`/store/edit/${store.storeId}`)}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Images Gallery */}
      {store.imageUrl && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative h-64 rounded-lg overflow-hidden">
              <img
                src={store.imageUrl}
                alt={`${store.storeName} - Image`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Store Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Thông tin cơ bản</h2>
            <div className="space-y-4">
              {store.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Mô tả</label>
                  <p className="text-gray-900">{store.description}</p>
                </div>
              )}

              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 mt-0.5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Địa chỉ</label>
                  <p className="text-gray-900">{storeService.formatFullAddress(store)}</p>
                </div>
              </div>

              {(store.latitude || store.longitude) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Vĩ độ</label>
                    <p className="text-gray-900">{store.latitude}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Kinh độ</label>
                    <p className="text-gray-900">{store.longitude}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-green-600" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                  <p className="text-gray-900">{store.phoneNumber}</p>
                </div>
              </div>

              {/* email removed from backend StoreResponse */}

              {(store.openTime || store.closeTime) && (
                <div className="flex items-start">
                  <Clock className="w-5 h-5 mr-3 mt-0.5 text-green-600" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Giờ mở cửa</label>
                    <p className="text-gray-900">{`${store.openTime || ''}${store.openTime && store.closeTime ? ' - ' : ''}${store.closeTime || ''}`}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          {store.adminNotes && (
            <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ghi chú từ Admin</h2>
              <p className="text-gray-900">{store.adminNotes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Status Management Card */}
          {getAvailableStatusTransitions().length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <Store className="w-5 h-5 mr-2 text-green-600" />
                Quản lý hoạt động
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Cập nhật trạng thái hoạt động của cửa hàng
              </p>
              <div className="space-y-2">
                {getAvailableStatusTransitions().map((transition) => {
                  const Icon = transition.icon;
                  return (
                    <button
                      key={transition.status}
                      onClick={() => openStatusModal(transition.status)}
                      className={`w-full flex items-center justify-center px-4 py-2.5 ${transition.color} text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {transition.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Trạng thái</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Trạng thái hiện tại</label>
                {getStatusBadge(store.status)}
              </div>

              {store.approvedBy && store.approvedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phê duyệt bởi</label>
                  <p className="text-sm text-gray-900">{store.approvedBy}</p>
                  <p className="text-xs text-gray-500">{formatDate(store.approvedAt)}</p>
                </div>
              )}

              {store.rejectedBy && store.rejectedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Từ chối bởi</label>
                  <p className="text-sm text-gray-900">{store.rejectedBy}</p>
                  <p className="text-xs text-gray-500">{formatDate(store.rejectedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Thông tin thời gian</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 mr-3 mt-0.5 text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngày tạo</label>
                  <p className="text-sm text-gray-900">{formatDate(store.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="w-5 h-5 mr-3 mt-0.5 text-gray-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Cập nhật lần cuối</label>
                  <p className="text-sm text-gray-900">{formatDate(store.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          {store.supplierName && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Nhà cung cấp</h2>
              <p className="text-gray-900">{store.supplierName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <AlertCircle className="w-6 h-6 mr-2" />
                Xác nhận thay đổi trạng thái
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Bạn đang thay đổi trạng thái cửa hàng từ{' '}
                  <span className="font-semibold">{storeService.getStatusLabel(store.status as any)}</span>
                  {' '}sang{' '}
                  <span className="font-semibold text-green-600">{storeService.getStatusLabel(selectedStatus)}</span>
                </p>
              </div>

              {/* Reason input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lý do thay đổi 
                  {(selectedStatus === 'TEMPORARILY_CLOSED' || selectedStatus === 'PERMANENTLY_CLOSED') && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Nhập lý do thay đổi trạng thái (ví dụ: Nghỉ Tết Nguyên Đán, Sửa chữa cơ sở...)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isUpdatingStatus}
                />
                {(selectedStatus === 'TEMPORARILY_CLOSED' || selectedStatus === 'PERMANENTLY_CLOSED') && (
                  <p className="text-xs text-gray-500 mt-1">
                    * Bắt buộc phải nhập lý do
                  </p>
                )}
              </div>

              {/* Warning for permanent closure */}
              {selectedStatus === 'PERMANENTLY_CLOSED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      Cảnh báo: Đóng cửa vĩnh viễn sẽ không thể hoàn tác. Cửa hàng sẽ không hiển thị với khách hàng nữa.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={isUpdatingStatus}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Xác nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
