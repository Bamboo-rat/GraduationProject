import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import orderService from '~/service/orderService';
import type { Order } from '~/service/orderService';

interface OrderDetailProps {
  loaderData?: {
    initialOrder: Order;
  };
}

export default function OrderDetail({ loaderData }: OrderDetailProps) {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // Initialize with loader data (no loading state!)
  const [order, setOrder] = useState<Order | null>(loaderData?.initialOrder || null);
  const [loading, setLoading] = useState(!loaderData); 
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Only load if not from loader
    if (!loaderData) {
      loadOrderDetail();
    }
  }, [orderId, loaderData]);

  const loadOrderDetail = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      setError('');
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error('Failed to load order:', err);
      setError(err.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-pulse-soft rounded-full h-16 w-16 bg-[#A4C3A2]"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="card p-6 border-l-4 border-[#E63946]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full">
              <svg className="h-6 w-6 text-[#E63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#2D2D2D] text-lg">{error || 'Không tìm thấy đơn hàng'}</p>
              <button
                onClick={() => navigate('/orders/list')}
                className="btn-secondary mt-3 text-sm"
              >
                ← Quay lại danh sách đơn hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/orders/list')}
              className="btn-secondary text-sm"
            >
              ← Quay lại
            </button>
            <div>
              <h1 className="heading-primary">Chi tiết đơn hàng #{order.orderCode}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`status-badge ${orderService.getStatusColor(order.status)}`}>
                  {orderService.getStatusLabel(order.status)}
                </span>
                <span className="text-muted">
                  {orderService.formatDate(order.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={loadOrderDetail}
            className="btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info Card */}
          <div className="card card-hover p-6">
            <h3 className="heading-secondary flex items-center gap-3">
              <div className="p-2 bg-[#E8FFED] rounded-lg">
                <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm text-muted">Họ tên:</label>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted">Số điện thoại:</label>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted">Email:</label>
                <p className="font-medium">{order.customerEmail || 'Chưa có thông tin'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="card card-hover p-6">
            <h3 className="heading-secondary flex items-center gap-3">
              <div className="p-2 bg-[#E8FFED] rounded-lg">
                <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              Địa chỉ giao hàng
            </h3>
            <div className="mt-4 p-4 bg-[#F8FFF9] rounded-lg border border-[#B7E4C7]">
              <p className="font-medium text-[#2D2D2D]">{order.shippingAddress.fullAddress || order.shippingAddress.addressLine}</p>
              {order.shippingAddress.ward && order.shippingAddress.district && order.shippingAddress.city && (
                <p className="text-sm text-muted mt-2">
                  {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
                </p>
              )}
            </div>
          </div>

          {/* Order Items Card */}
          <div className="card card-hover p-6">
            <h3 className="heading-secondary flex items-center gap-3">
              <div className="p-2 bg-[#E8FFED] rounded-lg">
                <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              Sản phẩm ({order.items.length})
            </h3>
            <div className="space-y-4 mt-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 border border-[#DDC6B6] rounded-lg hover:border-[#A4C3A2] transition-colors">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#2D2D2D]">{item.productName}</h4>
                    {item.variantName && (
                      <p className="text-sm text-muted mt-1">Phân loại: {item.variantName}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-muted">Số lượng: {item.quantity}</span>
                      <span className="text-muted">×</span>
                      <span className="font-semibold text-[#2F855A]">{orderService.formatVND(item.price)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-[#2D2D2D]">{orderService.formatVND(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Card */}
          {order.note && (
            <div className="card card-hover p-6">
              <h3 className="heading-secondary flex items-center gap-3">
                <div className="p-2 bg-[#E8FFED] rounded-lg">
                  <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                Ghi chú
              </h3>
              <div className="mt-4 p-4 bg-[#F5EDE6] rounded-lg">
                <p className="text-[#2D2D2D]">{order.note}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="card card-hover p-6">
            <h3 className="heading-secondary">Tổng quan đơn hàng</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#DDC6B6]">
                <span className="text-muted">Mã đơn:</span>
                <span className="font-semibold">{order.orderCode}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#DDC6B6]">
                <span className="text-muted">Ngày đặt:</span>
                <span className="font-semibold">{orderService.formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#DDC6B6]">
                <span className="text-muted">Phương thức TT:</span>
                <span className="font-semibold">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted">Trạng thái TT:</span>
                <span className={`font-semibold ${order.paymentStatus === 'PAID' ? 'text-[#2F855A]' : 'text-[#FF6B35]'}`}>
                  {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : order.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : 'Thất bại'}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between items-center py-2 border-t border-[#DDC6B6] mt-2">
                  <span className="text-muted">Mã vận đơn:</span>
                  <span className="font-semibold text-[#2F855A]">{order.trackingNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Summary Card */}
          <div className="card card-hover p-6">
            <h3 className="heading-secondary">Chi tiết giá</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-muted">Tạm tính:</span>
                <span className="font-medium">{orderService.formatVND(order.subtotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted">Phí vận chuyển:</span>
                <span className="font-medium">{orderService.formatVND(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between py-2 text-[#2F855A]">
                  <span>Giảm giá:</span>
                  <span className="font-semibold">-{orderService.formatVND(order.discount)}</span>
                </div>
              )}
              <div className="border-t border-[#DDC6B6] pt-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Tổng cộng:</span>
                  <span className="font-bold text-2xl text-[#2F855A]">{orderService.formatVND(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          {(order.confirmedAt || order.shippedAt || order.deliveredAt || order.cancelledAt) && (
            <div className="card card-hover p-6">
              <h3 className="heading-secondary">Lịch sử đơn hàng</h3>
              <div className="space-y-4 mt-4">
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-[#A4C3A2] rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="font-semibold">Đơn hàng đã tạo</p>
                    <p className="text-sm text-muted">{orderService.formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {order.confirmedAt && (
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-[#2F855A] rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-semibold">Đã xác nhận</p>
                      <p className="text-sm text-muted">{orderService.formatDate(order.confirmedAt)}</p>
                    </div>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-[#A4C3A2] rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-semibold">Đang giao hàng</p>
                      <p className="text-sm text-muted">{orderService.formatDate(order.shippedAt)}</p>
                    </div>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-[#2F855A] rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-semibold">Đã giao hàng</p>
                      <p className="text-sm text-muted">{orderService.formatDate(order.deliveredAt)}</p>
                    </div>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-[#E63946] rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-semibold">Đã hủy</p>
                      <p className="text-sm text-muted">{orderService.formatDate(order.cancelledAt)}</p>
                      {order.cancelReason && (
                        <p className="text-sm text-muted mt-1">Lý do: {order.cancelReason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}