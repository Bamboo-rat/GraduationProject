import { useEffect, useState } from 'react';
import orderService from '~/service/orderService';
import type { Order } from '~/service/orderService';

export default function DeliveryAssign() {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReadyOrders();
  }, []);

  const loadReadyOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getStoreOrders({
        status: 'PREPARING',
        page: 0,
        size: 50,
        sortBy: 'updatedAt',
        sortDir: 'ASC',
      });
      setReadyOrders(data.content);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const openShipModal = (order: Order) => {
    setSelectedOrder(order);
    setShowShipModal(true);
    // Set default estimated delivery to 3 days from now
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 3);
    setEstimatedDelivery(estimatedDate.toISOString().split('T')[0]);
  };

  const handleShipOrder = async () => {
    if (!selectedOrder) return;
    
    if (!trackingNumber.trim()) {
      alert('Vui lòng nhập mã vận đơn');
      return;
    }
    
    try {
      setSubmitting(true);
      await orderService.shipOrder(selectedOrder.id, trackingNumber);
      alert('Đơn hàng đã được giao cho Giao Hàng Nhanh!');
      setShowShipModal(false);
      setTrackingNumber('');
      setEstimatedDelivery('');
      loadReadyOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Phân công giao hàng</h1>
        <button
          onClick={loadReadyOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Làm mới
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Hướng dẫn phân công</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Danh sách đơn hàng đã được chuẩn bị xong và sẵn sàng để giao. Nhấn "Giao hàng" để chuyển đơn sang trạng thái đang vận chuyển.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đơn sẵn sàng giao</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{readyOrders.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng giá trị</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {orderService.formatVND(readyOrders.reduce((sum, o) => sum + o.totalAmount, 0))}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng sản phẩm</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {readyOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Ready Orders List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : readyOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>Không có đơn hàng sẵn sàng giao</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {readyOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{order.orderCode}
                      </h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        📦 Đang chuẩn bị
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Customer */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Khách hàng</h4>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-sm text-gray-600">{order.customerPhone}</p>
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Địa chỉ giao hàng</h4>
                        <p className="text-sm text-gray-600">{order.shippingAddress.fullAddress}</p>
                      </div>

                      {/* Summary */}
                      <div className="text-right">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Tổng đơn</h4>
                        <p className="text-lg font-bold text-blue-600">
                          {orderService.formatVND(order.totalAmount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={() => openShipModal(order)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                      >
                        🚚 Giao hàng
                      </button>
                      <a
                        href={`/orders/${order.id}`}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Xem chi tiết
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ship Modal */}
      {showShipModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Giao đơn hàng cho vận chuyển</h3>
            <p className="text-gray-600 mb-4">Đơn hàng: #{selectedOrder.orderCode}</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Đơn vị vận chuyển:</span> Giao Hàng Nhanh (GHN)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã vận đơn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mã vận đơn"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày giao dự kiến (tự động sau 3 ngày)
                </label>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-2">Thông tin đơn hàng</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Khách hàng:</span>
                  <span className="font-medium">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SĐT:</span>
                  <span className="font-medium">{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-bold text-blue-600">
                    {orderService.formatVND(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleShipOrder}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : '🚚 Xác nhận giao hàng'}
              </button>
              <button
                onClick={() => {
                  setShowShipModal(false);
                  setTrackingNumber('');
                  setEstimatedDelivery('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
