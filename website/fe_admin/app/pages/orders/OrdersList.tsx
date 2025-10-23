import DashboardLayout from '~/component/layout/DashboardLayout';

export default function OrdersList() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Quản lý Đơn hàng</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500 py-8">
            Quản lý tất cả đơn hàng trong hệ thống<br/>
            Chưa có dữ liệu - Cần implement backend API
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
