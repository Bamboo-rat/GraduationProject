import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import storeService from '~/service/storeService';
import type { StoreResponse, StoreUpdateRequest } from '~/service/storeService';

export default function StoreUpdateRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');

  const [store, setStore] = useState<StoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<StoreUpdateRequest>({
    name: '',
    address: '',
    ward: '',
    district: '',
    city: '',
    phoneNumber: '',
    description: '',
    email: '',
    latitude: undefined,
    longitude: undefined,
    imageUrls: [],
    openingHours: '',
  });

  const fetchStoreInfo = async () => {
    if (!storeId) {
      alert('Không tìm thấy ID cửa hàng');
      navigate('/store/list');
      return;
    }

    try {
      setLoading(true);
      const data = await storeService.getStoreById(storeId);
      setStore(data);
      // Pre-fill form with current data
      setFormData({
        name: data.name,
        address: data.address,
        ward: data.ward,
        district: data.district,
        city: data.city,
        phoneNumber: data.phoneNumber,
        description: data.description,
        email: data.email,
        latitude: data.latitude,
        longitude: data.longitude,
        imageUrls: data.imageUrls,
        openingHours: data.openingHours,
      });
    } catch (error) {
      console.error('Error fetching store:', error);
      alert('Lỗi khi tải thông tin cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim() || !formData.address?.trim() || !formData.phoneNumber?.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    if (!confirm('Bạn có chắc muốn gửi yêu cầu cập nhật thông tin cửa hàng?')) {
      return;
    }

    if (!storeId) return;

    try {
      setSubmitting(true);
      const result = await storeService.updateStore(storeId, formData);

      if (result.updateType === 'IMMEDIATE') {
        alert('Cập nhật thông tin cửa hàng thành công!');
      } else {
        alert('Gửi yêu cầu cập nhật thành công. Vui lòng chờ admin phê duyệt.');
      }

      navigate('/store/update-history');
    } catch (error: any) {
      console.error('Error submitting update:', error);
      const errorMessage = error.message || 'Lỗi khi gửi yêu cầu cập nhật';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseFloat(value) : undefined,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Không tìm thấy thông tin cửa hàng</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Yêu cầu cập nhật thông tin cửa hàng</h1>
        <p className="text-gray-600">
          Thay đổi thông tin cần được admin phê duyệt trước khi áp dụng
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên cửa hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Hiện tại: {store.name}</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Hiện tại: {store.phoneNumber}</p>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Hiện tại: {store.address}</p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Hiện tại: {store.description || 'Chưa có'}
              </p>
            </div>

            {/* Latitude - Hidden but keep data */}
            <input
              type="hidden"
              name="latitude"
              value={formData.latitude || ''}
            />

            {/* Longitude - Hidden but keep data */}
            <input
              type="hidden"
              name="longitude"
              value={formData.longitude || ''}
            />
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
            <a
              href="/store/profile"
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Hủy
            </a>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Chú ý</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Yêu cầu cập nhật cần được admin phê duyệt</li>
                <li>Chỉ có thể gửi một yêu cầu tại một thời điểm</li>
                <li>Thông tin hiện tại sẽ được giữ nguyên cho đến khi yêu cầu được duyệt</li>
                <li>Bạn có thể xem lịch sử yêu cầu tại trang "Lịch sử thay đổi"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
