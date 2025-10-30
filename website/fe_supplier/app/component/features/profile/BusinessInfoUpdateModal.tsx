import { useState, useEffect } from 'react';
import supplierService from '~/service/supplierService';
import type { SupplierBusinessUpdateRequest } from '~/service/supplierService';
import fileStorageService from '~/service/fileStorageService';
import { X, FileText, Upload } from 'lucide-react';
import Toast, { type ToastType } from '~/component/common/Toast';

interface BusinessInfoUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BusinessInfoUpdateModal({ isOpen, onClose, onSuccess }: BusinessInfoUpdateModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const [formData, setFormData] = useState<SupplierBusinessUpdateRequest>({
    taxCode: '',
    businessLicense: '',
    businessLicenseUrl: '',
    foodSafetyCertificate: '',
    foodSafetyCertificateUrl: '',
    supplierNotes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        taxCode: '',
        businessLicense: '',
        businessLicenseUrl: '',
        foodSafetyCertificate: '',
        foodSafetyCertificateUrl: '',
        supplierNotes: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBusinessLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        businessLicenseUrl: 'Vui lòng tải lên file ảnh (JPG, PNG) hoặc PDF',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        businessLicenseUrl: 'Kích thước file không được vượt quá 5MB',
      }));
      return;
    }

    try {
      setUploadingLicense(true);
      const url = await fileStorageService.uploadBusinessLicense(file);
      setFormData((prev) => ({ ...prev, businessLicenseUrl: url }));
      setErrors((prev) => ({ ...prev, businessLicenseUrl: '' }));
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        businessLicenseUrl: error.message || 'Không thể tải lên giấy phép kinh doanh',
      }));
    } finally {
      setUploadingLicense(false);
    }
  };

  const handleFoodSafetyCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        foodSafetyCertificateUrl: 'Vui lòng tải lên file ảnh (JPG, PNG) hoặc PDF',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        foodSafetyCertificateUrl: 'Kích thước file không được vượt quá 5MB',
      }));
      return;
    }

    try {
      setUploadingCertificate(true);
      const url = await fileStorageService.uploadFoodSafetyCertificate(file);
      setFormData((prev) => ({ ...prev, foodSafetyCertificateUrl: url }));
      setErrors((prev) => ({ ...prev, foodSafetyCertificateUrl: '' }));
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        foodSafetyCertificateUrl: error.message || 'Không thể tải lên chứng nhận ATTP',
      }));
    } finally {
      setUploadingCertificate(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (
      !formData.taxCode &&
      !formData.businessLicense &&
      !formData.businessLicenseUrl &&
      !formData.foodSafetyCertificate &&
      !formData.foodSafetyCertificateUrl
    ) {
      newErrors.form = 'Vui lòng điền ít nhất một trường thông tin doanh nghiệp';
    }

    if (formData.taxCode) {
      const taxCodeRegex = /^[0-9]{10}$|^[0-9]{13}$/;
      if (!taxCodeRegex.test(formData.taxCode.trim())) {
        newErrors.taxCode = 'Mã số thuế phải là 10 hoặc 13 chữ số';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await supplierService.requestBusinessInfoUpdate(formData);
      setToast({ type: 'success', message: 'Yêu cầu cập nhật thông tin doanh nghiệp đã được gửi! Vui lòng chờ admin phê duyệt.' });
      onSuccess();
      onClose();
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Không thể gửi yêu cầu cập nhật' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Yêu cầu cập nhật thông tin doanh nghiệp</h2>
            <p className="text-sm text-gray-600 mt-1">Thay đổi này cần được admin phê duyệt</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.form && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.form}
            </div>
          )}

          <div className="space-y-6">
            {/* Tax Code */}
            <div>
              <label htmlFor="taxCode" className="block text-sm font-medium text-gray-700 mb-2">
                Mã số thuế <span className="text-gray-400">(10 hoặc 13 chữ số)</span>
              </label>
              <input
                type="text"
                id="taxCode"
                name="taxCode"
                value={formData.taxCode}
                onChange={handleChange}
                placeholder="Nhập mã số thuế mới"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.taxCode ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.taxCode && <p className="text-red-500 text-sm mt-1">{errors.taxCode}</p>}
            </div>

            {/* Business License */}
            <div>
              <label htmlFor="businessLicense" className="block text-sm font-medium text-gray-700 mb-2">
                Số giấy phép kinh doanh
              </label>
              <input
                type="text"
                id="businessLicense"
                name="businessLicense"
                value={formData.businessLicense}
                onChange={handleChange}
                placeholder="Nhập số giấy phép kinh doanh mới"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Business License Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File giấy phép kinh doanh
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleBusinessLicenseUpload}
                disabled={uploadingLicense}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              {uploadingLicense && <p className="text-blue-600 text-sm mt-1">Đang tải lên...</p>}
              {formData.businessLicenseUrl && (
                <div className="mt-2">
                  <a
                    href={formData.businessLicenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline text-sm flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Xem file đã tải lên
                  </a>
                </div>
              )}
              {errors.businessLicenseUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.businessLicenseUrl}</p>
              )}
            </div>

            {/* Food Safety Certificate */}
            <div>
              <label htmlFor="foodSafetyCertificate" className="block text-sm font-medium text-gray-700 mb-2">
                Số chứng nhận ATTP
              </label>
              <input
                type="text"
                id="foodSafetyCertificate"
                name="foodSafetyCertificate"
                value={formData.foodSafetyCertificate}
                onChange={handleChange}
                placeholder="Nhập số chứng nhận ATTP mới"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Food Safety Certificate Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File chứng nhận ATTP
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFoodSafetyCertificateUpload}
                disabled={uploadingCertificate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              {uploadingCertificate && <p className="text-blue-600 text-sm mt-1">Đang tải lên...</p>}
              {formData.foodSafetyCertificateUrl && (
                <div className="mt-2">
                  <a
                    href={formData.foodSafetyCertificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline text-sm flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Xem file đã tải lên
                  </a>
                </div>
              )}
              {errors.foodSafetyCertificateUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.foodSafetyCertificateUrl}</p>
              )}
            </div>

            {/* Supplier Notes */}
            <div>
              <label htmlFor="supplierNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú <span className="text-gray-400">(Tùy chọn)</span>
              </label>
              <textarea
                id="supplierNotes"
                name="supplierNotes"
                value={formData.supplierNotes}
                onChange={handleChange}
                rows={4}
                placeholder="Thêm ghi chú hoặc lý do cập nhật..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Lưu ý quan trọng:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Thay đổi thông tin doanh nghiệp cần được admin phê duyệt</li>
              <li>Bạn chỉ có thể gửi một yêu cầu chờ duyệt tại một thời điểm</li>
              <li>Admin sẽ xem xét và phê duyệt hoặc từ chối yêu cầu của bạn</li>
              <li>Bạn sẽ nhận được thông báo khi yêu cầu được xử lý</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={loading || uploadingLicense || uploadingCertificate}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 font-medium transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
