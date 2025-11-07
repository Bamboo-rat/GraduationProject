import { useEffect, useState } from 'react';
import orderService from '~/service/orderService';
import storeService from '~/service/storeService';
import type { Order, OrderStatus } from '~/service/orderService';
import type { StoreResponse } from '~/service/storeService';

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Action modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [page, status, selectedStoreId]);

  const loadStores = async () => {
    try {
      setLoadingStores(true);
      const data = await storeService.getMyStores({
        page: 0,
        size: 100, // Load all stores
        sortBy: 'storeName',
        sortDirection: 'ASC',
      });
      setStores(data.content);
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoadingStores(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getStoreOrders({
        storeId: selectedStoreId || undefined,
        page,
        size: 10,
        status: status || undefined,
        searchTerm: searchTerm || undefined,
        sortBy: 'createdAt',
        sortDir: 'DESC',
      });
      setOrders(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadOrders();
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setSubmitting(true);
      await orderService.confirmOrder(selectedOrder.id, {
        estimatedDeliveryDate: estimatedDelivery || undefined,
      });
      alert('Xác nhận đơn hàng thành công!');
      setShowConfirmModal(false);
      setEstimatedDelivery('');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể xác nhận đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrepareOrder = async (orderId: string) => {
    if (!confirm('Bắt đầu chuẩn bị đơn hàng này?')) return;
    
    try {
      await orderService.prepareOrder(orderId);
      alert('Đơn hàng đã chuyển sang trạng thái chuẩn bị!');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    }
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
      alert('Đơn hàng đã chuyển sang trạng thái giao hàng qua Giao Hàng Nhanh!');
      setShowShipModal(false);
      setTrackingNumber('');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    if (!confirm('Xác nhận đơn hàng đã được giao thành công?')) return;
    
    try {
      await orderService.deliverOrder(orderId);
      alert('Xác nhận giao hàng thành công!');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy đơn');
      return;
    }
    
    try {
      setSubmitting(true);
      await orderService.cancelOrder(selectedOrder.id, { cancelReason });
      alert('Hủy đơn hàng thành công!');
      setShowCancelModal(false);
      setCancelReason('');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (order: Order, action: 'confirm' | 'ship' | 'cancel') => {
    setSelectedOrder(order);
    if (action === 'confirm') setShowConfirmModal(true);
    else if (action === 'ship') setShowShipModal(true);
    else if (action === 'cancel') setShowCancelModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Làm mới
        </button>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex overflow-x-auto border-b">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'PENDING', label: 'Chờ xác nhận' },
            { value: 'CONFIRMED', label: 'Đã xác nhận' },
            { value: 'PREPARING', label: 'Đang chuẩn bị' },
            { value: 'SHIPPING', label: 'Đang giao' },
            { value: 'DELIVERED', label: 'Đã giao' },
            { value: 'CANCELLED', label: 'Đã hủy' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value as OrderStatus | ''); setPage(0); }}
              className={`px-6 py-3 font-medium whitespace-nowrap ${
                status === tab.value
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar & Store Filter */}
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Store Filter Dropdown */}
            <div className="sm:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cửa hàng
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => { setSelectedStoreId(e.target.value); setPage(0); }}
                disabled={loadingStores}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Tất cả cửa hàng ({stores.length})</option>
                {stores.map((store) => (
                  <option key={store.storeId} value={store.storeId}>
                    {store.storeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tìm theo mã đơn, tên khách hàng, SĐT..."
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Store Info Summary */}
          {selectedStoreId && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Đang xem đơn hàng của:</span>
              <span className="font-semibold text-blue-600">
                {stores.find(s => s.storeId === selectedStoreId)?.storeName}
              </span>
              <button
                onClick={() => { setSelectedStoreId(''); setPage(0); }}
                className="text-gray-500 hover:text-gray-700 ml-2"
                title="Xóa bộ lọc"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* No Store Warning */}
      {!loadingStores && stores.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-800">Chưa có cửa hàng</p>
              <p className="text-sm text-yellow-700">
                Bạn cần tạo cửa hàng trước khi có thể nhận đơn hàng.{' '}
                <a href="/stores/create" className="underline hover:text-yellow-900">
                  Tạo cửa hàng ngay
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

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
            <p>Không có đơn hàng nào</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-b">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-800">#{order.orderCode}</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${orderService.getStatusColor(order.status)}`}>
                    {orderService.getStatusLabel(order.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {orderService.formatDate(order.createdAt)}
                  </span>
                </div>
                <a
                  href={`/orders/${order.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Chi tiết →
                </a>
              </div>

              {/* Order Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Thông tin khách hàng</h4>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-gray-600">{order.customerPhone}</p>
                      <p className="text-gray-600">{order.shippingAddress.addressLine}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Sản phẩm</h4>
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-gray-600">
                            SL: {item.quantity} × {orderService.formatVND(item.price)}
                          </p>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-blue-600">+{order.items.length - 2} sản phẩm khác</p>
                      )}
                    </div>
                  </div>

                  {/* Order Total & Actions */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Tổng tiền</h4>
                    <p className="text-2xl font-bold text-blue-600 mb-4">
                      {orderService.formatVND(order.totalAmount)}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openActionModal(order, 'confirm')}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            ✓ Xác nhận đơn
                          </button>
                          <button
                            onClick={() => openActionModal(order, 'cancel')}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            ✕ Hủy đơn
                          </button>
                        </>
                      )}
                      
                      {order.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => handlePrepareOrder(order.id)}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                          >
                            📦 Bắt đầu chuẩn bị
                          </button>
                          <button
                            onClick={() => openActionModal(order, 'cancel')}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            ✕ Hủy đơn
                          </button>
                        </>
                      )}
                      
                      {order.status === 'PREPARING' && (
                        <>
                          <button
                            onClick={() => openActionModal(order, 'ship')}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          >
                            🚚 Bắt đầu giao hàng
                          </button>
                          <button
                            onClick={() => openActionModal(order, 'cancel')}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            ✕ Hủy đơn
                          </button>
                        </>
                      )}
                      
                      {order.status === 'SHIPPING' && (
                        <button
                          onClick={() => handleDeliverOrder(order.id)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          ✓ Xác nhận đã giao
                        </button>
                      )}
                    </div>
                  </div>
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
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-gray-700">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Xác nhận đơn hàng</h3>
            <p className="text-gray-600 mb-4">Đơn hàng: #{selectedOrder.orderCode}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày giao hàng dự kiến (không bắt buộc)
              </label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmOrder}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
              <button
                onClick={() => { setShowConfirmModal(false); setEstimatedDelivery(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Bắt đầu giao hàng</h3>
            <p className="text-gray-600 mb-4">Đơn hàng: #{selectedOrder.orderCode}</p>
            
            <div className="space-y-4 mb-4">
              {/* Info about shipping provider */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Đơn vị vận chuyển: Giao Hàng Nhanh (GHN)</p>
                    <p className="text-xs text-blue-600 mt-1">Thời gian giao hàng dự kiến: 3 ngày</p>
                  </div>
                </div>
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
                  placeholder="Nhập mã vận đơn từ GHN"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Nhập mã vận đơn để khách hàng có thể tra cứu</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleShipOrder}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Bắt đầu giao'}
              </button>
              <button
                onClick={() => { setShowShipModal(false); setTrackingNumber(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Hủy đơn hàng</h3>
            <p className="text-gray-600 mb-4">Đơn hàng: #{selectedOrder.orderCode}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy đơn <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Nhập lý do hủy đơn"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelOrder}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
