export default function FinanceRevenue() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Doanh thu & Hoa hồng</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-500">Tổng doanh thu</p>
              <p className="text-2xl font-bold mt-2">0 ₫</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Hoa hồng đã nhận</p>
              <p className="text-2xl font-bold mt-2">0 ₫</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Hoa hồng chờ thanh toán</p>
              <p className="text-2xl font-bold mt-2">0 ₫</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
