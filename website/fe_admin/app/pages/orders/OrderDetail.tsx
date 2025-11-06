import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import orderService from '~/service/orderService';
import type { Order, OrderStatus } from '~/service/orderService';

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order:', err);
      alert('Không thể tải thông tin đơn hàng');
      navigate('/orders/list-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) {
      alert('Vui lòng chọn trạng thái mới');
      return;
    }

    if (!orderService.canUpdateToStatus(order.status, newStatus as OrderStatus)) {
      alert('Không thể chuyển sang trạng thái này');
      return;
    }

    try {
      setSubmitting(true);
      await orderService.updateOrderStatus(order.id, {
        status: newStatus as OrderStatus,
        note: statusNote || undefined,
      });
      alert('Cập nhật trạng thái thành công!');
      setShowUpdateStatusModal(false);
      setNewStatus('');
      setStatusNote('');
      loadOrder();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShip = async () => {
    if (!order) return;
    if (!trackingNumber.trim() || !shippingProvider.trim()) {
      alert('Vui lòng nhập mã vận đơn và đơn vị vận chuyển');
      return;
    }

    try {
      setSubmitting(true);
      await orderService.shipOrder(order.id, trackingNumber, shippingProvider);
      alert('Đơn hàng đã chuyển sang trạng thái giao hàng!');
      setShowShipModal(false);
      setTrackingNumber('');
      setShippingProvider('');
      loadOrder();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!order) return;

    try {
      switch (action) {
        case 'CONFIRM':
          if (!confirm('Xác nhận đơn hàng này?')) return;
          await orderService.confirmOrder(order.id);
          alert('Xác nhận đơn hàng thành công!');
          break;
        case 'PREPARE':
          if (!confirm('Bắt đầu chuẩn bị đơn hàng này?')) return;
          await orderService.prepareOrder(order.id);
          alert('Đơn hàng đã chuyển sang trạng thái chuẩn bị!');
          break;
        case 'DELIVER':
          if (!confirm('Xác nhận đơn hàng đã được giao thành công?')) return;
          await orderService.markAsDelivered(order.id);
          alert('Xác nhận giao hàng thành công!');
          break;
        case 'REFUND':
          if (!confirm('Xác nhận xử lý hoàn tiền cho đơn hàng này?')) return;
          await orderService.processRefund(order.id);
          alert('Hoàn tiền thành công!');
          break;
      }
      loadOrder();
    } catch (err: any) {
      alert(err.message || 'Không thể thực hiện thao tác');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">Không tìm thấy đơn hàng</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/orders/list-orders')}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
          >
            ← Quay lại danh sách
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Đơn hàng #{order.orderCode}</h1>
              <p className="text-gray-600 mt-1">Tạo lúc: {orderService.formatDate(order.createdAt)}</p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${orderService.getStatusColor(order.status)}`}>
              {orderService.getStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-3">Thao tác nhanh</h3>
          <div className="flex flex-wrap gap-2">
            {order.status === 'PENDING' && (
              <button
                onClick={() => handleQuickAction('CONFIRM')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                ✓ Xác nhận đơn
              </button>
            )}
            {order.status === 'CONFIRMED' && (
              <button
                onClick={() => handleQuickAction('PREPARE')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                📦 Bắt đầu chuẩn bị
              </button>
            )}
            {order.status === 'PREPARING' && (
              <button
                onClick={() => setShowShipModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                🚚 Bắt đầu giao hàng
              </button>
            )}
            {order.status === 'SHIPPING' && (
              <button
                onClick={() => handleQuickAction('DELIVER')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                ✓ Xác nhận đã giao
              </button>
            )}
            {(order.status === 'CANCELLED' || order.status === 'RETURNED') && order.paymentStatus === 'PAID' && (
              <button
                onClick={() => handleQuickAction('REFUND')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                💰 Xử lý hoàn tiền
              </button>
            )}
            <button
              onClick={() => setShowUpdateStatusModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ⚙️ Cập nhật trạng thái
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-bold text-gray-800">Sản phẩm đã đặt</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        {item.variantName && (
                          <p className="text-sm text-gray-600">Phân loại: {item.variantName}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{orderService.formatVND(item.price)}</p>
                        <p className="text-sm text-gray-600">Tổng: {orderService.formatVND(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span>{orderService.formatVND(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span>{orderService.formatVND(order.shippingFee)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{orderService.formatVND(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                    <span>Tổng cộng:</span>
                    <span className="text-blue-600">{orderService.formatVND(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-bold text-gray-800">Lịch sử trạng thái</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.statusHistory?.map((history, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-3 h-3 mt-1.5 rounded-full bg-blue-600"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {orderService.getStatusLabel(history.status)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {orderService.formatDate(history.timestamp)}
                        </p>
                        {history.note && (
                          <p className="text-sm text-gray-600 mt-1">Ghi chú: {history.note}</p>
                        )}
                        {history.updatedBy && (
                          <p className="text-xs text-gray-500 mt-1">Bởi: {history.updatedBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-bold text-gray-800">Thông tin khách hàng</h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Tên khách hàng</p>
                  <p className="font-medium text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Số điện thoại</p>
                  <p className="font-medium text-gray-900">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{order.customerEmail}</p>
                </div>
              </div>
            </div>

            {/* Store Info */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-bold text-gray-800">Thông tin cửa hàng</h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Cửa hàng</p>
                  <p className="font-medium text-gray-900">{order.storeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nhà cung cấp</p>
                  <p className="font-medium text-gray-900">{order.supplierName}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-bold text-gray-800">Địa chỉ giao hàng</h2>
              </div>
              <div className="p-6 space-y-2">
                <p className="font-medium text-gray-900">{order.shippingAddress.recipientName}</p>
                <p className="text-gray-600">{order.shippingAddress.phoneNumber}</p>
                <p className="text-gray-600">{order.shippingAddress.fullAddress}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="font-bold text-gray-800">Thanh toán</h2>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Phương thức</p>
                  <p className="font-medium text-gray-900">
                    {orderService.getPaymentMethodLabel(order.paymentMethod)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái thanh toán</p>
                  <p className="font-medium text-gray-900">
                    {orderService.getPaymentStatusLabel(order.paymentStatus)}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {(order.note || order.cancelReason) && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h2 className="font-bold text-gray-800">Thông tin thêm</h2>
                </div>
                <div className="p-6 space-y-3">
                  {order.note && (
                    <div>
                      <p className="text-sm text-gray-600">Ghi chú</p>
                      <p className="text-gray-900">{order.note}</p>
                    </div>
                  )}
                  {order.cancelReason && (
                    <div>
                      <p className="text-sm text-gray-600">Lý do hủy</p>
                      <p className="text-red-600">{order.cancelReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update Status Modal */}
        {showUpdateStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold mb-4">⚙️ Cập nhật trạng thái đơn hàng</h3>
              <p className="text-gray-600 mb-2">Đơn hàng: <span className="font-bold">#{order.orderCode}</span></p>
              <p className="text-sm text-gray-500 mb-4">
                Trạng thái hiện tại: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${orderService.getStatusColor(order.status)}`}>
                  {orderService.getStatusLabel(order.status)}
                </span>
              </p>
              
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái mới <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    {orderService.getAvailableStatusTransitions(order.status).map((s) => (
                      <option key={s} value={s}>
                        {orderService.getStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (không bắt buộc)
                  </label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Nhập ghi chú về việc cập nhật trạng thái..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  disabled={submitting || !newStatus}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Đang xử lý...' : '✓ Cập nhật'}
                </button>
                <button
                  onClick={() => { setShowUpdateStatusModal(false); setNewStatus(''); setStatusNote(''); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ship Modal */}
        {showShipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold mb-4">🚚 Bắt đầu giao hàng</h3>
              <p className="text-gray-600 mb-4">Đơn hàng: <span className="font-bold">#{order.orderCode}</span></p>
              
              <div className="space-y-4 mb-4">
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
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đơn vị vận chuyển <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={shippingProvider}
                    onChange={(e) => setShippingProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn đơn vị --</option>
                    <option value="GIAO_HANG_NHANH">Giao Hàng Nhanh</option>
                    <option value="GIAO_HANG_TIET_KIEM">Giao Hàng Tiết Kiệm</option>
                    <option value="VIETTEL_POST">Viettel Post</option>
                    <option value="VNPOST">VNPost</option>
                    <option value="J_T_EXPRESS">J&T Express</option>
                    <option value="GRAB_EXPRESS">Grab Express</option>
                    <option value="SHOPEE_EXPRESS">Shopee Express</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleShip}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Đang xử lý...' : '🚚 Bắt đầu giao'}
                </button>
                <button
                  onClick={() => { setShowShipModal(false); setTrackingNumber(''); setShippingProvider(''); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
