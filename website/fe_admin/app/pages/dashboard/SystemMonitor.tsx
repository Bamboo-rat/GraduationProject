import DashboardLayout from '~/component/layout/DashboardLayout';

export default function SystemMonitor() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Giám sát Hệ thống</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Trạng thái Server</h3>
            <div className="text-center text-gray-500 py-4">
              Chưa có dữ liệu
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-4">Database Status</h3>
            <div className="text-center text-gray-500 py-4">
              Chưa có dữ liệu
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
