import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import supplierService from '~/service/supplierService';
import type { SupplierResponse } from '~/service/supplierService';
import { Building2, Mail, Phone, MapPin, Briefcase, CreditCard, Store, Package, TrendingUp } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const statusConfig: Record<string, { label: string; color: string }> = {
      ACTIVE: { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
      PENDING_APPROVAL: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' },
      SUSPENDED: { label: 'Tạm ngừng', color: 'bg-red-100 text-red-800' },
      REJECTED: { label: 'Bị từ chối', color: 'bg-gray-100 text-gray-800' },
    };
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Không thể tải thông tin nhà cung cấp'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden">
            {supplier.avatarUrl ? (
              <img src={supplier.avatarUrl} alt={supplier.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-white font-bold">
                {supplier.businessName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{supplier.businessName}</h1>
            <p className="text-gray-600 mt-1">Nhà cung cấp: {supplier.fullName}</p>
            <div className="mt-2">{getStatusBadge(supplier.status)}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Số dư ví</p>
              <p className="text-2xl font-bold text-green-600">
                {supplier.wallet ? formatCurrency(supplier.wallet.availableBalance) : formatCurrency(0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng cửa hàng</p>
              <p className="text-2xl font-bold text-blue-600">{supplier.totalStores ?? 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-purple-600">{supplier.totalProducts ?? 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Doanh thu tháng</p>
              <p className="text-2xl font-bold text-orange-600">
                {supplier.wallet ? formatCurrency(supplier.wallet.monthlyEarnings) : formatCurrency(0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-green-600" />
            Thông tin doanh nghiệp
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <Building2 className="w-5 h-5 mr-3 mt-0.5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Loại hình kinh doanh</p>
                <p className="font-medium text-gray-900">{getBusinessTypeLabel(supplier.businessType)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="w-5 h-5 mr-3 mt-0.5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Địa chỉ kinh doanh</p>
                <p className="font-medium text-gray-900">{supplier.businessAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Mã số thuế</p>
                <p className="font-medium text-gray-900">{supplier.taxCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Giấy phép ĐKKD</p>
                <p className="font-medium text-gray-900">{supplier.businessLicense}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Chứng nhận ATTP</p>
              <p className="font-medium text-gray-900">{supplier.foodSafetyCertificate}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Tỷ lệ hoa hồng</p>
              <p className="font-medium text-gray-900">
                {supplier.commissionRate !== null ? `${(supplier.commissionRate * 100).toFixed(1)}%` : 'Chưa thiết lập'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-green-600" />
            Thông tin liên hệ
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{supplier.email}</p>
              </div>
            </div>

            <div className="flex items-center">
              <Phone className="w-5 h-5 mr-3 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Số điện thoại</p>
                <p className="font-medium text-gray-900">{supplier.phoneNumber}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Username</p>
              <p className="font-medium text-gray-900">{supplier.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ngày tham gia</p>
                <p className="font-medium text-gray-900">{formatDate(supplier.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                <p className="font-medium text-gray-900">{formatDate(supplier.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => navigate('/settings/payment')}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Cập nhật thông tin thanh toán
            </button>
          </div>
        </div>
      </div>

      {/* Stores List */}
      {supplier.stores && supplier.stores.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Store className="w-5 h-5 mr-2 text-green-600" />
              Cửa hàng của tôi ({supplier.stores.length})
            </h2>
            <button
              onClick={() => navigate('/store/list')}
              className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
            >
              Xem tất cả
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplier.stores.map((store) => (
              <div
                key={store.storeId}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/store/profile?storeId=${store.storeId}`)}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{store.storeName}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{store.address}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{store.phoneNumber}</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      store.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : store.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {store.status === 'ACTIVE' ? 'Hoạt động' : store.status === 'PENDING' ? 'Chờ duyệt' : store.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có cửa hàng</h3>
            <p className="text-gray-500 mb-4">Bạn chưa tạo cửa hàng nào</p>
            <button
              onClick={() => navigate('/store/create')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Tạo cửa hàng đầu tiên
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/products/list')}
            className="bg-white hover:bg-green-50 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all border border-green-200"
          >
            <Package className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-800">Quản lý sản phẩm</span>
          </button>
          <button
            onClick={() => navigate('/store/list')}
            className="bg-white hover:bg-green-50 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all border border-green-200"
          >
            <Store className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-800">Quản lý cửa hàng</span>
          </button>
          <button
            onClick={() => navigate('/finance/revenue')}
            className="bg-white hover:bg-green-50 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all border border-green-200"
          >
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-800">Doanh thu</span>
          </button>
          <button
            onClick={() => navigate('/settings/payment')}
            className="bg-white hover:bg-green-50 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all border border-green-200"
          >
            <CreditCard className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-800">Thanh toán</span>
          </button>
        </div>
      </div>
    </div>
  );
}
