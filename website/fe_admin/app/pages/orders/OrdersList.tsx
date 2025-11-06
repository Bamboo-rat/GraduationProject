import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import DashboardLayout from '~/component/layout/DashboardLayout';
import orderService from '~/service/orderService';
import type { Order, OrderStatus } from '~/service/orderService';

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modals
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingProvider, setShippingProvider] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [page, status]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders({
        page,
        size: 10,
        status: status || undefined,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      });
      setOrders(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load orders:', err);
      alert('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadOrders();
      return;
    }

    try {
      setLoading(true);
      // Try to search by order code
      const order = await orderService.getOrderByCode(searchTerm.trim());
      setOrders([order]);
      setTotalPages(1);
    } catch (err) {
      console.error('Search failed:', err);
      alert('Không tìm thấy đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) {
      alert('Vui lòng chọn trạng thái mới');
      return;
    }

    if (!orderService.canUpdateToStatus(selectedOrder.status, newStatus as OrderStatus)) {
      alert('Không thể chuyển sang trạng thái này');
      return;
    }

    try {
      setSubmitting(true);
      await orderService.updateOrderStatus(selectedOrder.id, {
        status: newStatus as OrderStatus,
        note: statusNote || undefined,
      });
      alert('Cập nhật trạng thái thành công!');
      setShowUpdateStatusModal(false);
      setNewStatus('');
      setStatusNote('');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickConfirm = async (orderId: string) => {
    if (!confirm('Xác nhận đơn hàng này?')) return;
    
    try {
      await orderService.confirmOrder(orderId);
      alert('Xác nhận đơn hàng thành công!');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể xác nhận đơn hàng');
    }
  };

  const handleQuickPrepare = async (orderId: string) => {
    if (!confirm('Bắt đầu chuẩn bị đơn hàng này?')) return;
    
    try {
      await orderService.prepareOrder(orderId);
      alert('Đơn hàng đã chuyển sang trạng thái chuẩn bị!');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleShip = async () => {
    if (!selectedOrder) return;
    if (!trackingNumber.trim() || !shippingProvider.trim()) {
      alert('Vui lòng nhập mã vận đơn và đơn vị vận chuyển');
      return;
    }

    try {
      setSubmitting(true);
      await orderService.shipOrder(selectedOrder.id, trackingNumber, shippingProvider);
      alert('Đơn hàng đã chuyển sang trạng thái giao hàng!');
      setShowShipModal(false);
      setTrackingNumber('');
      setShippingProvider('');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDeliver = async (orderId: string) => {
    if (!confirm('Xác nhận đơn hàng đã được giao thành công?')) return;
    
    try {
      await orderService.markAsDelivered(orderId);
      alert('Xác nhận giao hàng thành công!');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Xác nhận xử lý hoàn tiền cho đơn hàng này?')) return;
    
    try {
      await orderService.processRefund(orderId);
      alert('Hoàn tiền thành công!');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể xử lý hoàn tiền');
    }
  };

  const openUpdateStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus('');
    setStatusNote('');
    setShowUpdateStatusModal(true);
  };

  const openShipModal = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber('');
    setShippingProvider('');
    setShowShipModal(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h1>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🔄 Làm mới
          </button>
        </div>

        {/* Status Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex overflow-x-auto border-b">
            {[
              { value: '', label: 'Tất cả', icon: '📋' },
              { value: 'PENDING', label: 'Chờ xác nhận', icon: '⏳' },
              { value: 'CONFIRMED', label: 'Đã xác nhận', icon: '✅' },
              { value: 'PREPARING', label: 'Đang chuẩn bị', icon: '📦' },
              { value: 'SHIPPING', label: 'Đang giao', icon: '🚚' },
              { value: 'DELIVERED', label: 'Đã giao', icon: '✔️' },
              { value: 'CANCELLED', label: 'Đã hủy', icon: '❌' },
              { value: 'RETURNED', label: 'Đã trả hàng', icon: '↩️' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value as OrderStatus | ''); setPage(0); }}
                className={`px-6 py-3 font-medium whitespace-nowrap transition ${
                  status === tab.value
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="p-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tìm theo mã đơn hàng (ví dụ: ORD001)..."
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                🔍 Tìm kiếm
              </button>
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); loadOrders(); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  ✕ Xóa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">Không có đơn hàng nào</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 flex justify-between items-center border-b">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-800 text-lg">#{order.orderCode}</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${orderService.getStatusColor(order.status)}`}>
                      {orderService.getStatusLabel(order.status)}
                    </span>
                    <span className="text-sm text-gray-600">
                      📅 {orderService.formatDate(order.createdAt)}
                    </span>
                  </div>
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                  >
                    Chi tiết đầy đủ →
                  </Link>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Customer Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">👤</span>
                        Khách hàng
                      </h4>
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-gray-600">📞 {order.customerPhone}</p>
                        <p className="text-gray-600">📧 {order.customerEmail}</p>
                      </div>
                    </div>

                    {/* Store Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">🏪</span>
                        Cửa hàng
                      </h4>
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-gray-900">{order.storeName}</p>
                        <p className="text-gray-600">Nhà cung cấp: {order.supplierName}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">📦</span>
                        Sản phẩm ({order.items.length})
                      </h4>
                      <div className="space-y-2">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            <p className="text-gray-600">
                              SL: {item.quantity} × {orderService.formatVND(item.price)}
                            </p>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-blue-600 font-medium">+{order.items.length - 2} sản phẩm khác</p>
                        )}
                      </div>
                    </div>

                    {/* Payment & Actions */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">💰 Thanh toán</h4>
                      <p className="text-2xl font-bold text-blue-600 mb-1">
                        {orderService.formatVND(order.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        {orderService.getPaymentMethodLabel(order.paymentMethod)}
                      </p>
                      
                      {/* Quick Actions */}
                      <div className="space-y-2">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleQuickConfirm(order.id)}
                            className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                          >
                            ✓ Xác nhận
                          </button>
                        )}
                        
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleQuickPrepare(order.id)}
                            className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
                          >
                            📦 Chuẩn bị
                          </button>
                        )}
                        
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => openShipModal(order)}
                            className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                          >
                            🚚 Giao hàng
                          </button>
                        )}
                        
                        {order.status === 'SHIPPING' && (
                          <button
                            onClick={() => handleQuickDeliver(order.id)}
                            className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                          >
                            ✓ Đã giao
                          </button>
                        )}

                        {(order.status === 'CANCELLED' || order.status === 'RETURNED') && order.paymentStatus === 'PAID' && (
                          <button
                            onClick={() => handleRefund(order.id)}
                            className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition"
                          >
                            💰 Hoàn tiền
                          </button>
                        )}
                        
                        <button
                          onClick={() => openUpdateStatusModal(order)}
                          className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition"
                        >
                          ⚙️ Cập nhật
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">📍 Địa chỉ giao hàng:</span> {order.shippingAddress.fullAddress}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              ← Trước
            </button>
            <span className="px-4 py-2 text-gray-700 font-medium">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Sau →
            </button>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateStatusModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold mb-4">⚙️ Cập nhật trạng thái đơn hàng</h3>
              <p className="text-gray-600 mb-2">Đơn hàng: <span className="font-bold">#{selectedOrder.orderCode}</span></p>
              <p className="text-sm text-gray-500 mb-4">
                Trạng thái hiện tại: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${orderService.getStatusColor(selectedOrder.status)}`}>
                  {orderService.getStatusLabel(selectedOrder.status)}
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
                    {orderService.getAvailableStatusTransitions(selectedOrder.status).map((s) => (
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
        {showShipModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold mb-4">🚚 Bắt đầu giao hàng</h3>
              <p className="text-gray-600 mb-4">Đơn hàng: <span className="font-bold">#{selectedOrder.orderCode}</span></p>
              
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
