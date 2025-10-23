import DashboardLayout from '~/component/layout/DashboardLayout';

export default function WasteReport() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Báo cáo Lãng phí</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center text-gray-500 py-8">
            Báo cáo về lãng phí thực phẩm và tối ưu hóa<br/>
            Chưa có dữ liệu - Cần implement backend API
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
