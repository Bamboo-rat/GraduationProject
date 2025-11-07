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
        size: 100,
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="heading-primary">Quản lý đơn hàng</h1>
            <p className="text-muted">Theo dõi và quản lý tất cả đơn hàng của bạn</p>
          </div>
          <button
            onClick={loadOrders}
            className="btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
      
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="card p-6 mb-6">
        <div className="flex overflow-x-auto pb-2 gap-1">
          {[
            { value: '', label: 'Tất cả', count: orders.length },
            { value: 'PENDING', label: 'Chờ xác nhận', count: orders.filter(o => o.status === 'PENDING').length },
            { value: 'CONFIRMED', label: 'Đã xác nhận', count: orders.filter(o => o.status === 'CONFIRMED').length },
            { value: 'PREPARING', label: 'Đang chuẩn bị', count: orders.filter(o => o.status === 'PREPARING').length },
            { value: 'SHIPPING', label: 'Đang giao', count: orders.filter(o => o.status === 'SHIPPING').length },
            { value: 'DELIVERED', label: 'Đã giao', count: orders.filter(o => o.status === 'DELIVERED').length },
            { value: 'CANCELED', label: 'Đã hủy', count: orders.filter(o => o.status === 'CANCELED').length },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value as OrderStatus | ''); setPage(0); }}
              className={`px-6 py-3 font-medium whitespace-nowrap rounded-lg transition-all duration-200 flex items-center gap-2 ${
                status === tab.value
                  ? 'tab-active bg-[#A4C3A2] bg-opacity-10'
                  : 'tab-inactive bg-[#F5EDE6] hover:bg-[#DDC6B6]'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-1 rounded-full text-xs ${
                status === tab.value 
                  ? 'bg-[#A4C3A2] text-[#2D2D2D]' 
                  : 'bg-[#DDC6B6] text-[#6B6B6B]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar & Store Filter */}
        <div className="mt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Store Filter Dropdown */}
            <div className="lg:w-80">
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                Lọc theo cửa hàng
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => { setSelectedStoreId(e.target.value); setPage(0); }}
                disabled={loadingStores}
                className="input-field w-full"
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
            <div className="flex-1">
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-2">
                Tìm kiếm đơn hàng
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field flex-1"
                  placeholder="Tìm theo mã đơn, tên khách hàng, SĐT..."
                />
                <button
                  onClick={handleSearch}
                  className="btn-primary whitespace-nowrap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Store Info Summary */}
          {selectedStoreId && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-[#F8FFF9] rounded-lg border border-[#B7E4C7]">
              <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm text-[#2D2D2D]">
                Đang xem đơn hàng của: <span className="font-semibold text-[#2F855A]">
                  {stores.find(s => s.storeId === selectedStoreId)?.storeName}
                </span>
              </span>
              <button
                onClick={() => { setSelectedStoreId(''); setPage(0); }}
                className="ml-auto text-[#6B6B6B] hover:text-[#E63946] transition-colors"
                title="Xóa bộ lọc"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* No Store Warning */}
      {!loadingStores && stores.length === 0 && (
        <div className="card p-6 mb-6 border-l-4 border-[#FF6B35]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-full">
              <svg className="h-6 w-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#2D2D2D] text-lg">Chưa có cửa hàng</p>
              <p className="text-muted mt-1">
                Bạn cần tạo cửa hàng trước khi có thể nhận đơn hàng.
              </p>
              <a href="/stores/create" className="btn-primary mt-3 inline-block text-sm">
                Tạo cửa hàng ngay
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center">
            <div className="animate-pulse-soft rounded-full h-16 w-16 bg-[#A4C3A2] mx-auto mb-4"></div>
            <p className="text-muted">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="p-4 bg-[#F5EDE6] rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-10 w-10 text-[#DDC6B6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">Không có đơn hàng nào</h3>
            <p className="text-muted mb-4">Hiện tại không có đơn hàng nào phù hợp với bộ lọc của bạn.</p>
            <button
              onClick={() => { setStatus(''); setSearchTerm(''); setSelectedStoreId(''); setPage(0); }}
              className="btn-primary"
            >
              Xem tất cả đơn hàng
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card card-hover overflow-hidden">
              {/* Order Header */}
              <div className="bg-[#F8FFF9] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#B7E4C7]">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-bold text-[#2D2D2D] text-lg">#{order.orderCode}</span>
                  <span className={`status-badge ${orderService.getStatusColor(order.status)}`}>
                    {orderService.getStatusLabel(order.status)}
                  </span>
                  <span className="text-sm text-muted">
                    {orderService.formatDate(order.createdAt)}
                  </span>
                </div>
                <a
                  href={`/orders/${order.id}`}
                  className="btn-secondary text-sm"
                >
                  Chi tiết →
                </a>
              </div>

              {/* Order Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#2D2D2D] mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#A4C3A2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Thông tin khách hàng
                    </h4>
                    <div className="space-y-2">
                      <p className="font-medium text-[#2D2D2D]">{order.customerName}</p>
                      <p className="text-muted text-sm">{order.customerPhone}</p>
                      <p className="text-muted text-sm truncate">{order.shippingAddress.addressLine}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#2D2D2D] mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#A4C3A2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Sản phẩm ({order.items.length})
                    </h4>
                    <div className="space-y-3">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#2D2D2D] text-sm truncate">{item.productName}</p>
                            <p className="text-muted text-xs">
                              SL: {item.quantity} × {orderService.formatVND(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-[#2F855A] font-medium">
                          +{order.items.length - 2} sản phẩm khác
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Total & Actions */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#2D2D2D] mb-3">Tổng tiền</h4>
                    <p className="text-2xl font-bold text-[#2F855A] mb-4">
                      {orderService.formatVND(order.totalAmount)}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openActionModal(order, 'confirm')}
                            className="btn-primary w-full text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Xác nhận đơn
                          </button>
                          <button
                            onClick={() => openActionModal(order, 'cancel')}
                            className="btn-danger w-full text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Hủy đơn
                          </button>
                        </>
                      )}
                      
                      {order.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => handlePrepareOrder(order.id)}
                            className="btn-primary w-full text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Bắt đầu chuẩn bị
                          </button>
                          <button
                            onClick={() => openActionModal(order, 'cancel')}
                            className="btn-danger w-full text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Hủy đơn
                          </button>
                        </>
                      )}
                      
                      {order.status === 'PREPARING' && (
                        <>
                          <button
                            onClick={() => openActionModal(order, 'ship')}
                            className="btn-primary w-full text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Bắt đầu giao hàng
                          </button>
                          <button
                            onClick={() => openActionModal(order, 'cancel')}
                            className="btn-danger w-full text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Hủy đơn
                          </button>
                        </>
                      )}
                      
                      {order.status === 'SHIPPING' && (
                        <button
                          onClick={() => handleDeliverOrder(order.id)}
                          className="btn-primary w-full text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Xác nhận đã giao
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
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ← Trước
          </button>
          <span className="px-4 py-2 text-[#2D2D2D] font-medium bg-[#F5EDE6] rounded-lg">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Sau →
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold text-[#2D2D2D] mb-2">Xác nhận đơn hàng</h3>
            <p className="text-muted mb-4">Đơn hàng: #{selectedOrder.orderCode}</p>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-3">
                Ngày giao hàng dự kiến (không bắt buộc)
              </label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="input-field w-full"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmOrder}
                disabled={submitting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
              </button>
              <button
                onClick={() => { setShowConfirmModal(false); setEstimatedDelivery(''); }}
                className="btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ship Modal */}
      {showShipModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold text-[#2D2D2D] mb-2">Bắt đầu giao hàng</h3>
            <p className="text-muted mb-4">Đơn hàng: #{selectedOrder.orderCode}</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-[#E8FFED] border border-[#B7E4C7] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#2F855A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-[#2F855A]">Đơn vị vận chuyển: Giao Hàng Nhanh (GHN)</p>
                    <p className="text-xs text-[#2F855A] mt-1">Thời gian giao hàng dự kiến: 2-3 ngày làm việc</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-3">
                  Mã vận đơn <span className="text-[#E63946]">*</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="input-field w-full"
                  placeholder="Nhập mã vận đơn từ GHN"
                  required
                />
                <p className="text-xs text-muted mt-2">Nhập mã vận đơn để khách hàng có thể tra cứu trạng thái giao hàng</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleShipOrder}
                disabled={submitting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Bắt đầu giao hàng'}
              </button>
              <button
                onClick={() => { setShowShipModal(false); setTrackingNumber(''); }}
                className="btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold text-[#2D2D2D] mb-2">Hủy đơn hàng</h3>
            <p className="text-muted mb-4">Đơn hàng: #{selectedOrder.orderCode}</p>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-3">
                Lý do hủy đơn <span className="text-[#E63946]">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input-field w-full resize-none"
                rows={4}
                placeholder="Nhập lý do hủy đơn hàng..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelOrder}
                disabled={submitting}
                className="btn-danger flex-1 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
              </button>
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="btn-secondary"
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