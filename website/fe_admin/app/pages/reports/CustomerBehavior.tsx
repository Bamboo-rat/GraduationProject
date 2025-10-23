import DashboardLayout from '~/component/layout/DashboardLayout';

export default function CustomerBehavior() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Phân tích Khách hàng</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500 py-8">
            Phân tích hành vi và xu hướng khách hàng<br/>
            Chưa có dữ liệu - Cần implement backend API và chart library
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
