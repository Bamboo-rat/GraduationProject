import DashboardLayout from '~/component/DashboardLayout';

export default function PartnersPerformance() {
  return (
    <DashboardLayout>
      <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Báo cáo Hiệu suất Đối tác</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Tổng số đối tác</h3>
          <p className="text-3xl font-bold text-gray-800">--</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Đối tác hoạt động</h3>
          <p className="text-3xl font-bold text-green-600">--</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Tổng doanh thu</h3>
          <p className="text-3xl font-bold text-blue-600">--</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Bảng xếp hạng đối tác</h2>
        <div className="text-center text-gray-500 py-8">
          Chưa có dữ liệu - Cần implement backend API
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
