import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import storeService from '~/service/storeService';
import fileStorageService from '~/service/fileStorageService';
import type {
  StoreCreateRequest,
  StoreUpdateRequest,
  StoreResponse,
} from '~/service/storeService';

export default function StoreForm() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const isEditMode = !!storeId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form data
  const [formData, setFormData] = useState<StoreCreateRequest | StoreUpdateRequest>({
    name: '',
    description: '',
    address: '',
    ward: '',
    district: '',
    city: '',
    latitude: undefined,
    longitude: undefined,
    phoneNumber: '',
    email: '',
    imageUrls: [],
    openingHours: '',
  });

  useEffect(() => {
    if (isEditMode && storeId) {
      fetchStoreData();
    }
  }, [isEditMode, storeId]);

  const fetchStoreData = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      const store = await storeService.getStoreById(storeId);
      setFormData({
        name: store.name,
        description: store.description || '',
        address: store.address,
        ward: store.ward,
        district: store.district,
        city: store.city,
        latitude: store.latitude,
        longitude: store.longitude,
        phoneNumber: store.phoneNumber,
        email: store.email || '',
        imageUrls: store.imageUrls || [],
        openingHours: store.openingHours || '',
      });
    } catch (error: any) {
      alert(error.message || 'Không thể tải thông tin cửa hàng');
      navigate('/store/list');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await fileStorageService.uploadStoreImage(file);
        uploadedUrls.push(url);
      }

      setFormData((prev) => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), ...uploadedUrls],
      }));

      alert(`Đã tải lên ${uploadedUrls.length} ảnh thành công`);
    } catch (error: any) {
      alert(error.message || 'Không thể tải lên ảnh');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, index) => index !== indexToRemove),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name || !formData.name.trim()) {
      alert('Vui lòng nhập tên cửa hàng');
      return false;
    }
    if (!formData.address || !formData.address.trim()) {
      alert('Vui lòng nhập địa chỉ');
      return false;
    }
    if (!formData.ward || !formData.ward.trim()) {
      alert('Vui lòng nhập phường/xã');
      return false;
    }
    if (!formData.district || !formData.district.trim()) {
      alert('Vui lòng nhập quận/huyện');
      return false;
    }
    if (!formData.city || !formData.city.trim()) {
      alert('Vui lòng nhập thành phố/tỉnh');
      return false;
    }
    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      alert('Vui lòng nhập số điện thoại');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (isEditMode && storeId) {
        const result = await storeService.updateStore(storeId, formData);

        if (result.updateType === 'IMMEDIATE') {
          alert('Cập nhật cửa hàng thành công!');
        } else {
          alert('Yêu cầu cập nhật đã được gửi và đang chờ admin phê duyệt');
        }
      } else {
        await storeService.createStore(formData as StoreCreateRequest);
        alert('Tạo cửa hàng thành công! Cửa hàng đang chờ admin phê duyệt');
      }

      navigate('/store/list');
    } catch (error: any) {
      alert(error.message || `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} cửa hàng`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/store/list')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Chỉnh sửa Cửa hàng' : 'Tạo Cửa hàng mới'}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? 'Cập nhật thông tin cửa hàng (thay đổi quan trọng cần admin duyệt)'
              : 'Tạo cửa hàng mới (cần admin phê duyệt)'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nhập tên cửa hàng"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Mô tả về cửa hàng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="store@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Giờ mở cửa</label>
                <input
                  type="text"
                  name="openingHours"
                  value={formData.openingHours || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="8:00 - 22:00 hàng ngày"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Địa chỉ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Số nhà, tên đường"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phường/Xã <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ward"
                  value={formData.ward || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Phường/Xã"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quận/Huyện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Quận/Huyện"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thành phố/Tỉnh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Thành phố/Tỉnh"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vĩ độ (Latitude)</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  step="0.000001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="10.762622"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kinh độ (Longitude)</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  step="0.000001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="106.660172"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh cửa hàng</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tải ảnh lên</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImages}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {uploadingImages && (
                <p className="text-sm text-blue-600 mt-2">Đang tải ảnh lên...</p>
              )}
            </div>

            {formData.imageUrls && formData.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(formData.imageUrls || []).map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Store ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/store/list')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImages}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Tạo cửa hàng'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
