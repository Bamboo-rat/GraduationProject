import DashboardLayout from '~/component/DashboardLayout';

export default function DashboardOverview() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan hệ thống</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Tổng đơn hàng</h3>
            <p className="text-3xl font-bold text-gray-800">--</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Doanh thu</h3>
            <p className="text-3xl font-bold text-green-600">--</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Đối tác</h3>
            <p className="text-3xl font-bold text-blue-600">--</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-2">Khách hàng</h3>
            <p className="text-3xl font-bold text-purple-600">--</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Biểu đồ doanh thu</h2>
          <div className="text-center text-gray-500 py-8">
            Chưa có dữ liệu - Cần implement backend API và chart library
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
