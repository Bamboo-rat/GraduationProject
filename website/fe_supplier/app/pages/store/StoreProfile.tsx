import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import storeService from '~/service/storeService';
import type { StoreResponse } from '~/service/storeService';
import { MapPin, Phone, Mail, Clock, Calendar, Edit, ArrowLeft } from 'lucide-react';

export default function StoreProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');

  const [store, setStore] = useState<StoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Thao tác nhanh</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/store/update-history')}
                className="w-full px-4 py-2 bg-white hover:bg-green-50 text-gray-800 rounded-lg font-medium transition-colors border border-green-200"
              >
                Lịch sử cập nhật
              </button>
              <button
                onClick={() => navigate('/products/list')}
                className="w-full px-4 py-2 bg-white hover:bg-green-50 text-gray-800 rounded-lg font-medium transition-colors border border-green-200"
              >
                Sản phẩm của cửa hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
