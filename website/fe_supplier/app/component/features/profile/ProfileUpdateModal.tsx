import { useState, useEffect } from 'react';
import supplierService from '~/service/supplierService';
import fileStorageService from '~/service/fileStorageService';
import type { SupplierResponse, SupplierProfileUpdateRequest } from '~/service/supplierService';
import { X, Save, User, Phone, MapPin, Upload } from 'lucide-react';
import Toast, { type ToastType } from '~/component/common/Toast';

interface ProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentSupplier: SupplierResponse;
}

export default function ProfileUpdateModal({ isOpen, onClose, onSuccess, currentSupplier }: ProfileUpdateModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const [formData, setFormData] = useState<SupplierProfileUpdateRequest>({
    fullName: currentSupplier.fullName || '',
    phoneNumber: currentSupplier.phoneNumber || '',
    avatarUrl: currentSupplier.avatarUrl || '',
    businessAddress: currentSupplier.businessAddress || '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: currentSupplier.fullName || '',
        phoneNumber: currentSupplier.phoneNumber || '',
        avatarUrl: currentSupplier.avatarUrl || '',
        businessAddress: currentSupplier.businessAddress || '',
      });
    }
  }, [isOpen, currentSupplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Vui lòng chọn file ảnh' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Kích thước ảnh không được vượt quá 5MB' });
      return;
    }

    try {
      setUploadingAvatar(true);
      const url = await fileStorageService.uploadSupplierLogo(file);
      setFormData((prev) => ({ ...prev, avatarUrl: url }));
      setToast({ type: 'success', message: 'Tải ảnh đại diện thành công!' });
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Không thể tải ảnh lên' });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const validateForm = (): boolean => {
    if (!formData.fullName || !formData.fullName.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập họ tên' });
      return false;
    }

    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập số điện thoại' });
      return false;
    }

    const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setToast({ type: 'error', message: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!confirm('Bạn có chắc muốn cập nhật thông tin cá nhân?')) return;

    try {
      setSubmitting(true);

      const updateData: SupplierProfileUpdateRequest = {};
      if (formData.fullName) updateData.fullName = formData.fullName;
      if (formData.phoneNumber) updateData.phoneNumber = formData.phoneNumber;
      if (formData.avatarUrl) updateData.avatarUrl = formData.avatarUrl;
      if (formData.businessAddress) updateData.businessAddress = formData.businessAddress;

      await supplierService.updateProfile(updateData);

      setToast({ type: 'success', message: 'Cập nhật thông tin thành công!' });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setToast({ type: 'error', message: error.message || 'Không thể cập nhật thông tin' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Cập nhật thông tin cá nhân</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="pb-6 border-b">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Ảnh đại diện
              </h3>
              
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-2 border-gray-200">
                      <User className="w-12 h-12 text-green-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label className="block">
                    <span className="sr-only">Chọn ảnh đại diện</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-green-50 file:text-green-700
                        hover:file:bg-green-100
                        cursor-pointer"
                    />
                  </label>
                  {uploadingAvatar && (
                    <p className="text-sm text-blue-600 mt-2">Đang tải ảnh lên...</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    JPG, PNG hoặc GIF. Tối đa 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-green-600" />
                Thông tin cá nhân
              </h3>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber || ''}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0912345678"
                    />
                  </div>
                </div>

                {/* Business Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ kinh doanh
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="businessAddress"
                      value={formData.businessAddress || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nhập địa chỉ kinh doanh của bạn"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingAvatar}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
