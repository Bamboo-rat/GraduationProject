import { useEffect, useState } from 'react';
import orderService from '~/service/orderService';
import type { Order } from '~/service/orderService';

export default function DeliveryTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const data = await orderService.getStoreOrders({
        status: 'SHIPPING',
        page: 0,
        size: 50,
        sortBy: 'shippedAt',
        sortDir: 'DESC',
      });
      setOrders(data.content);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    if (!confirm('Xác nhận đơn hàng đã được giao thành công?')) return;
    
    try {
      await orderService.deliverOrder(orderId);
      alert('Xác nhận giao hàng thành công!');
      loadDeliveries();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Theo dõi giao hàng</h1>
        <button
          onClick={loadDeliveries}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đang giao hàng</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{orders.length}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Giao đúng hẹn hôm nay</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {orders.filter(o => 
                  o.estimatedDeliveryDate && 
                  new Date(o.estimatedDeliveryDate).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Quá hạn giao</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {orders.filter(o => 
                  o.estimatedDeliveryDate && 
                  new Date(o.estimatedDeliveryDate) < new Date()
                ).length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <p>Không có đơn hàng đang giao</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => {
              const isOverdue = order.estimatedDeliveryDate && new Date(order.estimatedDeliveryDate) < new Date();
              const isDueToday = order.estimatedDeliveryDate && 
                new Date(order.estimatedDeliveryDate).toDateString() === new Date().toDateString();

              return (
                <div key={order.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{order.orderCode}
                        </h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          🚚 Đang giao hàng
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ⚠️ Quá hạn
                          </span>
                        )}
                        {isDueToday && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            📅 Giao hôm nay
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Customer */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Khách hàng</h4>
                          <p className="text-sm font-medium">{order.customerName}</p>
                          <p className="text-sm text-gray-600">{order.customerPhone}</p>
                        </div>

                        {/* Address */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Địa chỉ giao hàng</h4>
                          <p className="text-sm text-gray-600">{order.shippingAddress.fullAddress}</p>
                        </div>

                        {/* Delivery Info */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Thông tin giao hàng</h4>
                          {order.shippedAt && (
                            <p className="text-sm text-gray-600">
                              Xuất kho: {new Date(order.shippedAt).toLocaleString('vi-VN')}
                            </p>
                          )}
                          {order.estimatedDeliveryDate && (
                            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                              Dự kiến: {new Date(order.estimatedDeliveryDate).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Products Summary */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            {order.items.length} sản phẩm • Tổng: <span className="font-semibold text-gray-900">
                              {orderService.formatVND(order.totalAmount)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => handleDeliverOrder(order.id)}
                              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              ✓ Xác nhận đã giao
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Chi tiết đơn hàng đang giao</h3>
                <p className="text-gray-600 mt-1">Mã đơn: #{selectedOrder.orderCode}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Delivery Timeline */}
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-indigo-800 mb-3">Trạng thái giao hàng</h4>
              <div className="space-y-3">
                {selectedOrder.statusHistory
                  .filter(h => ['CONFIRMED', 'PREPARING', 'SHIPPING'].includes(h.status))
                  .map((history, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">
                            {orderService.getStatusLabel(history.status)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(history.timestamp).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Thông tin khách hàng</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-600">Tên:</span> {selectedOrder.customerName}</p>
                  <p><span className="text-gray-600">SĐT:</span> {selectedOrder.customerPhone}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Địa chỉ giao hàng</h4>
                <p className="text-sm text-gray-700">{selectedOrder.shippingAddress.fullAddress}</p>
              </div>
            </div>

            {/* Products */}
            <div className="mb-4">
              <h4 className="font-semibold mb-3">Sản phẩm</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-sm text-gray-500">{item.variantName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {item.quantity} × {orderService.formatVND(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">{orderService.formatVND(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleDeliverOrder(selectedOrder.id);
                  setSelectedOrder(null);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ✓ Xác nhận đã giao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
