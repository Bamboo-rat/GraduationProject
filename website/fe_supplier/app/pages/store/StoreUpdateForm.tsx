import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import storeService from '~/service/storeService';
import fileStorageService from '~/service/fileStorageService';
import locationService from '~/service/locationService';
import supplierService from '~/service/supplierService';
import AddressAutocomplete from '~/component/features/AddressAutocomplete';
import Toast, { type ToastType } from '~/component/common/Toast';
import type {
  StoreCreateRequest,
  StoreUpdateRequest,
  StoreResponse,
} from '~/service/storeService';

export default function StoreUpdateForm() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const isEditMode = !!storeId;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  // Location dropdown state
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Form data
  const [formData, setFormData] = useState<StoreCreateRequest | StoreUpdateRequest>({
    storeName: '',
    description: '',
    address: '',
    street: '',
    ward: '',
    district: '',
    province: '',
    latitude: undefined,
    longitude: undefined,
    phoneNumber: '',
    imageUrl: '',
    openTime: '',
    closeTime: '',
  });

  // FIX: Load provinces first, then load store data or supplier logo
  useEffect(() => {
    const initialize = async () => {
      // Step 1: Load provinces
      setLoadingLocation(true);
      try {
        const provincesData = await locationService.getProvinces();
        setProvinces(provincesData);

        // Step 2: If in edit mode, load store data after provinces are loaded
        if (isEditMode && storeId) {
          await fetchStoreData();
        } else {
          // Step 3: If creating new store, load supplier info to set default imageUrl
          await loadSupplierLogo();
        }
      } catch (error) {
        console.error('Error initializing:', error);
        setProvinces([]);
      } finally {
        setLoadingLocation(false);
      }
    };
    initialize();
  }, [isEditMode, storeId]);

  // Lấy quận/huyện khi chọn tỉnh 
  useEffect(() => {
    if (!formData.province || provinces.length === 0) {
      return;
    }

    const fetchDistricts = async () => {
      setLoadingLocation(true);
      try {
        const province = provinces.find(p => p.name === formData.province);
        if (!province) {
          console.warn('Province not found:', formData.province);
          return;
        }

        const data = await locationService.getDistricts(province.code);
        setDistricts(data);
      } catch (error) {
        console.error('Error fetching districts:', error);
        setDistricts([]);
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchDistricts();
  }, [formData.province, provinces]);

  // Lấy phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (!formData.district || districts.length === 0) {
      return;
    }

    const fetchWards = async () => {
      setLoadingLocation(true);
      try {
        const district = districts.find(d => d.name === formData.district);
        if (!district) {
          console.warn('District not found:', formData.district);
          return;
        }

        const data = await locationService.getWards(district.code);
        setWards(data);
      } catch (error) {
        console.error('Error fetching wards:', error);
        setWards([]);
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchWards();
  }, [formData.district, districts]);

  const loadSupplierLogo = async () => {
    try {
      const supplier = await supplierService.getCurrentSupplier();
      // Set imageUrl to supplier's avatar (logo) or business license URL as fallback
      const defaultImage = supplier.avatarUrl || supplier.businessLicenseUrl;
      if (defaultImage) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: defaultImage,
        }));
      }
    } catch (error) {
      console.error('Error loading supplier logo:', error);
      // Don't block the form if this fails
    }
  };

  const fetchStoreData = async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      const store = await storeService.getStoreById(storeId);
      setFormData({
        storeName: store.storeName || '',
        description: store.description || '',
        address: store.address || '',
        street: store.street || '',
        ward: store.ward || '',
        district: store.district || '',
        province: store.province || '',
        latitude: store.latitude,
        longitude: store.longitude,
        phoneNumber: store.phoneNumber || '',
        imageUrl: store.imageUrl || '',
        openTime: store.openTime || '',
        closeTime: store.closeTime || '',
      });
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Không thể tải thông tin cửa hàng' });
      navigate('/store/list');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // FIX: Reset child dropdowns when parent changes
    if (name === 'province') {
      // When province changes, clear district and ward
      setFormData((prev) => ({ ...prev, [name]: value, district: '', ward: '' }));
      setDistricts([]);
      setWards([]);
    } else if (name === 'district') {
      // When district changes, clear ward
      setFormData((prev) => ({ ...prev, [name]: value, ward: '' }));
      setWards([]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImages(true);
      const url = await fileStorageService.uploadStoreImage(file);

      setFormData((prev) => ({
        ...prev,
        imageUrl: url,
      }));

      setToast({ type: 'success', message: 'Đã tải lên ảnh thành công' });
    } catch (error: any) {
      setToast({ type: 'error', message: error.message || 'Không thể tải lên ảnh' });
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: '',
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.storeName || !formData.storeName.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập tên cửa hàng' });
      return false;
    }
    if (!formData.address || !formData.address.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập địa chỉ' });
      return false;
    }
    if (!formData.ward || !formData.ward.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập phường/xã' });
      return false;
    }
    if (!formData.district || !formData.district.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập quận/huyện' });
      return false;
    }
    if (!formData.province || !formData.province.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập thành phố/tỉnh' });
      return false;
    }
    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập số điện thoại' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Client-side heuristic to show a contextual confirmation
    const willRequireApproval = storeService.requiresApproval(
      formData as StoreUpdateRequest
    );

    const confirmMessage = willRequireApproval
      ? 'Những thay đổi bạn thực hiện có thể yêu cầu admin phê duyệt. Tiếp tục?'
      : 'Bạn có chắc muốn lưu thay đổi ngay (áp dụng tức thì)?';

    if (!confirm(confirmMessage)) return;

    if (!isEditMode) {
      // create new store
      try {
        setSubmitting(true);
        // Clean the data: remove empty strings and ensure correct types
        const cleanedData: StoreCreateRequest = {};
        Object.keys(formData).forEach((key) => {
          const value = formData[key as keyof typeof formData];
          if (value !== '' && value !== null && value !== undefined) {
            if (key === 'latitude' || key === 'longitude') {
              // Ensure coordinates are numbers
              cleanedData[key as keyof StoreCreateRequest] = Number(value) as any;
            } else {
              cleanedData[key as keyof StoreCreateRequest] = value as any;
            }
          }
        });
        await storeService.createStore(cleanedData);
        setToast({ type: 'success', message: 'Tạo cửa hàng thành công! Cửa hàng đang chờ admin phê duyệt' });
        setTimeout(() => navigate('/store/list'), 2000);
      } catch (error: any) {
        setToast({ type: 'error', message: error.response?.data?.message || error.message || 'Không thể tạo cửa hàng' });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // edit existing store
    if (!storeId) return;

    try {
      setSubmitting(true);
      // Clean the data: remove empty strings and ensure correct types
      const cleanedData: StoreUpdateRequest = {};
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof typeof formData];
        if (value !== '' && value !== null && value !== undefined) {
          if (key === 'latitude' || key === 'longitude') {
            // Ensure coordinates are numbers
            cleanedData[key as keyof StoreUpdateRequest] = Number(value) as any;
          } else {
            cleanedData[key as keyof StoreUpdateRequest] = value as any;
          }
        }
      });
      const result = await storeService.updateStore(storeId, cleanedData);

      if (result.updateType === 'IMMEDIATE') {
        // backend applied changes immediately
        setToast({ type: 'success', message: 'Cập nhật thông tin cửa hàng thành công!' });
        setTimeout(() => navigate('/store/profile'), 2000);
      } else {
        // backend created a pending update
        setToast({ type: 'success', message: 'Yêu cầu cập nhật đã được gửi và đang chờ admin phê duyệt' });
        setTimeout(() => navigate('/store/update-history'), 2000);
      }
    } catch (error: any) {
      console.error('Error submitting update:', error);
      setToast({ type: 'error', message: error.response?.data?.message || error.message || 'Không thể cập nhật cửa hàng' });
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
                  name="storeName"
                  value={formData.storeName || ''}
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Giờ mở cửa</label>
                <div className="flex space-x-2">
                  <input
                    type="time"
                    name="openTime" 
                    value={formData.openTime || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="time"
                    name="closeTime"
                    value={formData.closeTime || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <AddressAutocomplete
                  value={formData.address || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                  onPlaceSelected={(place) => {
                    setFormData(prev => ({
                      ...prev,
                      address: place.address,
                      latitude: place.latitude,
                      longitude: place.longitude,
                    }));
                  }}
                  placeholder="Nhập địa chỉ để tìm kiếm..."
                  required
                />
              </div>

              {/* Province */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỉnh/Thành phố <span className="text-red-500">*</span>
                </label>
                <select
                  name="province"
                  value={formData.province || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={loadingLocation}
                >
                  <option value="">{loadingLocation ? 'Đang tải...' : 'Chọn tỉnh/thành'}</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.name}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quận/Huyện <span className="text-red-500">*</span>
                </label>
                <select
                  name="district"
                  value={formData.district || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={!formData.province || loadingLocation}
                >
                  <option value="">{loadingLocation ? 'Đang tải...' : !formData.province ? 'Chọn tỉnh trước' : 'Chọn quận/huyện'}</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phường/Xã <span className="text-red-500">*</span>
                </label>
                <select
                  name="ward"
                  value={formData.ward || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={!formData.district || loadingLocation}
                >
                  <option value="">{loadingLocation ? 'Đang tải...' : !formData.district ? 'Chọn quận trước' : 'Chọn phường/xã'}</option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.name}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hidden latitude/longitude fields - auto-filled from address autocomplete */}
              <input type="hidden" name="latitude" value={formData.latitude || ''} />
              <input type="hidden" name="longitude" value={formData.longitude || ''} />
            </div>
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh cửa hàng</h3>
            
            {/* Info message when creating new store with default image */}
            {!isEditMode && formData.imageUrl && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  ℹ️ Ảnh logo của bạn đã được đặt làm ảnh mặc định cho cửa hàng. Bạn có thể thay đổi bằng cách tải ảnh mới lên.
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tải ảnh lên</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImages}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {uploadingImages && (
                <p className="text-sm text-blue-600 mt-2">Đang tải ảnh lên...</p>
              )}
            </div>

            {formData.imageUrl && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="relative group">
                  <img
                    src={formData.imageUrl}
                    alt="Store"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage()}
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
              {submitting
                ? 'Đang xử lý...'
                : isEditMode
                ? storeService.requiresApproval(formData as StoreUpdateRequest)
                  ? 'Gửi yêu cầu'
                  : 'Lưu thay đổi'
                : 'Tạo cửa hàng'}
            </button>
          </div>
        </div>
      </form>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
