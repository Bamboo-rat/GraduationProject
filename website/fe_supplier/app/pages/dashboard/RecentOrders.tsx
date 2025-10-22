export default function RecentOrders() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng gần đây</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <p className="text-gray-500 text-center py-8">Chưa có đơn hàng nào</p>
        </div>
      </div>
    </div>
  );
}
