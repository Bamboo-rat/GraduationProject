import { useState, useEffect } from 'react';
import storeService from '~/service/storeService';
import type { Store } from '~/service/storeService';

export default function StoreProfile() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStoreInfo = async () => {
    try {
      setLoading(true);
      const data = await storeService.getMyStore();
      setStore(data);
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
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Thông tin cửa hàng</h1>
        <a
          href="/store/update-request"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Yêu cầu cập nhật
        </a>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Tên cửa hàng</label>
            <div className="text-lg font-semibold text-gray-800">{store.storeName}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Số điện thoại</label>
            <div className="text-lg text-gray-800">{store.phoneNumber}</div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-2">Địa chỉ</label>
            <div className="text-lg text-gray-800">{store.address}</div>
          </div>

          {store.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">Mô tả</label>
              <div className="text-gray-700">{store.description}</div>
            </div>
          )}

          {(store.latitude && store.longitude) && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">Tọa độ</label>
              <div className="text-gray-700">
                Latitude: {store.latitude}, Longitude: {store.longitude}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Ngày tạo</label>
            <div className="text-gray-700">
              {new Date(store.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Cập nhật lần cuối</label>
            <div className="text-gray-700">
              {new Date(store.updatedAt).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Lưu ý</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Để thay đổi thông tin cửa hàng, vui lòng gửi yêu cầu cập nhật. Yêu cầu sẽ được admin xem xét và phê duyệt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
