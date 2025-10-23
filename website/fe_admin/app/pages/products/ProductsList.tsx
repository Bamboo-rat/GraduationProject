import DashboardLayout from '~/component/layout/DashboardLayout';

export default function ProductsList() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Tất cả Sản phẩm</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500 py-8">
            Trang quản lý tất cả sản phẩm trong hệ thống<br/>
            Chưa có dữ liệu - Cần implement backend API
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
