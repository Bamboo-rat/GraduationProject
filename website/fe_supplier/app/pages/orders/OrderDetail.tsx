import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import orderService from '~/service/orderService';
import type { Order } from '~/service/orderService';

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-800">{error || 'Không tìm thấy đơn hàng'}</p>
              <button
                onClick={() => navigate('/orders/list')}
                className="text-sm text-red-600 hover:text-red-800 underline mt-1"
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders/list')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Quay lại
          </button>
          <h1 className="text-2xl font-bold">Chi tiết đơn hàng #{order.orderCode}</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${orderService.getStatusColor(order.status)}`}>
            {orderService.getStatusLabel(order.status)}
          </span>
        </div>
        <button
          onClick={loadOrderDetail}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Thông tin khách hàng
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Tên:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SĐT:</span>
                <span className="font-medium">{order.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{order.customerEmail || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Địa chỉ giao hàng
            </h3>
            <p className="text-gray-700">{order.shippingAddress.fullAddress || order.shippingAddress.addressLine}</p>
            {order.shippingAddress.ward && order.shippingAddress.district && order.shippingAddress.city && (
              <p className="text-sm text-gray-500 mt-2">
                {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
              </p>
            )}
          </div>

          {/* Order Items Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Sản phẩm ({order.items.length})
            </h3>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{item.productName}</h4>
                    {item.variantName && (
                      <p className="text-sm text-gray-600">Phân loại: {item.variantName}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-gray-600">SL: {item.quantity}</span>
                      <span className="text-gray-600">×</span>
                      <span className="font-medium text-blue-600">{orderService.formatVND(item.price)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{orderService.formatVND(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Card */}
          {order.note && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Ghi chú
              </h3>
              <p className="text-gray-700">{order.note}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Tổng quan đơn hàng</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mã đơn:</span>
                <span className="font-medium">{order.orderCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ngày đặt:</span>
                <span className="font-medium">{orderService.formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phương thức TT:</span>
                <span className="font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trạng thái TT:</span>
                <span className={`font-medium ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                  {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : order.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : 'Thất bại'}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã vận đơn:</span>
                  <span className="font-medium">{order.trackingNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Summary Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Chi tiết giá</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Tạm tính:</span>
                <span>{orderService.formatVND(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span>{orderService.formatVND(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá:</span>
                  <span>-{orderService.formatVND(order.discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Tổng cộng:</span>
                  <span className="font-bold text-xl text-blue-600">{orderService.formatVND(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          {order.confirmedAt || order.shippedAt || order.deliveredAt || order.cancelledAt ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Lịch sử đơn hàng</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Đơn hàng đã tạo</p>
                    <p className="text-sm text-gray-500">{orderService.formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {order.confirmedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Đã xác nhận</p>
                      <p className="text-sm text-gray-500">{orderService.formatDate(order.confirmedAt)}</p>
                    </div>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Đang giao hàng</p>
                      <p className="text-sm text-gray-500">{orderService.formatDate(order.shippedAt)}</p>
                    </div>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Đã giao hàng</p>
                      <p className="text-sm text-gray-500">{orderService.formatDate(order.deliveredAt)}</p>
                    </div>
                  </div>
                )}
                {order.cancelledAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium">Đã hủy</p>
                      <p className="text-sm text-gray-500">{orderService.formatDate(order.cancelledAt)}</p>
                      {order.cancelReason && (
                        <p className="text-sm text-gray-600 mt-1">Lý do: {order.cancelReason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
