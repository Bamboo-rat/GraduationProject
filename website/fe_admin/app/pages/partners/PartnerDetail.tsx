import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import supplierService, { type Supplier, type SupplierStatus } from '~/service/supplierService';
import Toast from '~/component/common/Toast';
import { downloadFile, viewFile } from '~/utils/fileUtils';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  Store,
  Package,
  ArrowLeft,
  Ban,
  CheckCircle,
  Download,
  Eye
} from 'lucide-react';

export default function PartnerDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    if (userId) {
      fetchSupplierDetail();
    }
  }, [userId]);

  // Helper function to detect PDF files
  const isPdfFile = (fileUrl: string | null | undefined): boolean => {
    if (!fileUrl) return false;
    const url = fileUrl.toLowerCase();
    return url.endsWith('.pdf') || url.includes('/raw/upload/') || url.includes('/pdf') || url.includes('_pdf');
  };

  // Handle file download
  const handleDownload = (fileUrl: string | null | undefined, filename?: string) => {
    if (!fileUrl) return;
    try {
      downloadFile(fileUrl, filename);
      setToast({ message: 'File đang được tải xuống', type: 'success' });
    } catch (error) {
      console.error('Error downloading file:', error);
      setToast({ message: 'Không thể tải file', type: 'error' });
    }
  };

  const fetchSupplierDetail = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await supplierService.getSupplierById(userId);
      setSupplier(response);
    } catch (error: any) {
      console.error('Error fetching supplier details:', error);
      setToast({
        message: error.response?.data?.message || 'Không thể tải thông tin đối tác',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!supplier || !suspendReason.trim()) {
      setToast({ message: 'Vui lòng nhập lý do đình chỉ', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await supplierService.suspendSupplier(supplier.userId, suspendReason);
      setToast({ message: 'Đã đình chỉ nhà cung cấp thành công', type: 'success' });
      setShowSuspendModal(false);
      setSuspendReason('');
      await fetchSupplierDetail();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Không thể đình chỉ nhà cung cấp',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!supplier) return;

    try {
      setLoading(true);
      await supplierService.unsuspendSupplier(supplier.userId);
      setToast({ message: 'Đã gỡ bỏ đình chỉ thành công', type: 'success' });
      setShowUnsuspendModal(false);
      await fetchSupplierDetail();
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Không thể gỡ bỏ đình chỉ',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SupplierStatus) => {
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${supplierService.getStatusColorClass(status)}`}>
        {supplierService.getStatusLabel(status)}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!supplier) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">Không tìm thấy thông tin đối tác</div>
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/partners/list-partners')}
              className="text-blue-600 hover:text-blue-800"
            >
              Quay lại danh sách
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
              onClick={() => navigate('/partners/list-partners')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Chi tiết Đối tác</h1>
              <p className="text-gray-600 mt-1">{supplier.businessName}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            {supplier.status === 'ACTIVE' && (
              <button
                onClick={() => setShowSuspendModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <Ban className="w-4 h-4 mr-2" />
                Đình chỉ
              </button>
            )}
            {supplier.status === 'SUSPENDED' && (
              <button
                onClick={() => setShowUnsuspendModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Gỡ đình chỉ
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Thông tin cá nhân
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                  <p className="mt-1 text-gray-900">{supplier.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tên đăng nhập</label>
                  <p className="mt-1 text-gray-900">@{supplier.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {supplier.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {supplier.phoneNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                Thông tin doanh nghiệp
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tên doanh nghiệp</label>
                  <p className="mt-1 text-gray-900">{supplier.businessName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Loại hình kinh doanh</label>
                  <p className="mt-1 text-gray-900">{supplier.businessType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Mã số thuế</label>
                  <p className="mt-1 text-gray-900">{supplier.taxCode}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Giấy phép kinh doanh</label>
                  <p className="mt-1 text-gray-900">{supplier.businessLicense}</p>
                </div>
                {supplier.businessLicenseUrl && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 block mb-2">File giấy phép</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewFile(supplier.businessLicenseUrl!)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Xem file
                      </button>
                      <button
                        onClick={() => handleDownload(supplier.businessLicenseUrl, 'giay-phep-kinh-doanh.pdf')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Tải về
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            {supplier.businessAddress && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Địa chỉ
                </h2>
                <p className="text-gray-900">{supplier.businessAddress}</p>
              </div>
            )}

            {/* Food Safety Certificate */}
            {supplier.foodSafetyCertificate && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Giấy chứng nhận ATTP
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Số giấy chứng nhận</label>
                    <p className="mt-1 text-gray-900">{supplier.foodSafetyCertificate}</p>
                  </div>
                  {supplier.foodSafetyCertificateUrl && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500 block mb-2">File chứng nhận</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewFile(supplier.foodSafetyCertificateUrl!)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Xem file
                        </button>
                        <button
                          onClick={() => handleDownload(supplier.foodSafetyCertificateUrl, 'chung-nhan-attp.pdf')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Tải về
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <img
                  src={supplier.avatarUrl || 'https://via.placeholder.com/150'}
                  alt={supplier.fullName}
                  className="w-32 h-32 rounded-full mx-auto object-cover mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900">{supplier.fullName}</h3>
                <p className="text-sm text-gray-500">{supplier.businessName}</p>
                <div className="mt-3">
                  {getStatusBadge(supplier.status)}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Thống kê</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Store className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-gray-600">Cửa hàng</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{supplier.totalStores || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-gray-600">Sản phẩm</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{supplier.totalProducts || 0}</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin hệ thống</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày đăng ký</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </p>
                </div>
                {supplier.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cập nhật lần cuối</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(supplier.updatedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowSuspendModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Đình chỉ nhà cung cấp</h3>
              <p className="text-sm text-gray-500 mb-4">
                Đình chỉ <strong>{supplier.fullName}</strong> ({supplier.businessName})?
              </p>
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                <strong>Lưu ý:</strong> Tất cả hoạt động bán hàng sẽ bị khóa
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do đình chỉ *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Nhập lý do đình chỉ..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={!suspendReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận đình chỉ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsuspend Modal */}
      {showUnsuspendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowUnsuspendModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Gỡ bỏ đình chỉ</h3>
              <p className="text-sm text-gray-500 mb-4">
                Gỡ bỏ đình chỉ cho <strong>{supplier.fullName}</strong> ({supplier.businessName})?
              </p>
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                Nhà cung cấp sẽ được khôi phục hoạt động
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUnsuspendModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUnsuspend}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Xác nhận gỡ đình chỉ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
