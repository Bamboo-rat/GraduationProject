import DashboardLayout from '~/component/layout/DashboardLayout';

export default function FinanceReconciliation() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Đối soát & Hoa hồng</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500 py-8">
            Quản lý đối soát và tính hoa hồng<br/>
            Chưa có dữ liệu - Cần implement backend API
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
