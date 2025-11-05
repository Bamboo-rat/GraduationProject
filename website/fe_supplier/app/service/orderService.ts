import axiosInstance from '../config/axios';
import type { ApiResponse, Page } from './types';

// Types
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl?: string;
}

export interface OrderAddress {
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  fullAddress: string;
}

export interface Order {
  id: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  
  storeId: string;
  storeName: string;
  supplierId: string;
  supplierName: string;
  
  items: OrderItem[];
  
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  
  paymentMethod: string;
  paymentStatus: string;
  
  shippingAddress: OrderAddress;
  
  note?: string;
  cancelReason?: string;
  
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED';

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  preparingOrders: number;
  shippingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  
  totalRevenue: number;
  monthlyRevenue: number;
  
  averageOrderValue: number;
  completionRate: number;
}

export interface ConfirmOrderRequest {
  estimatedDeliveryDate?: string;
  note?: string;
}

export interface CancelOrderRequest {
  cancelReason: string;
}

export interface ShipOrderRequest {
  trackingNumber?: string;
  shippingProvider?: string;
  estimatedDeliveryDate?: string;
}

// Order Service for Supplier
class SupplierOrderService {
  private handleError(error: any): Error {
    return new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }

  /**
   * Get orders by store ID
   */
  async getStoreOrders(params?: {
    storeId?: string;
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<Page<Order>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortDir) queryParams.append('sortDir', params.sortDir);

      const storeId = params?.storeId || 'me'; // Use 'me' for current supplier's store
      const { data } = await axiosInstance.get<ApiResponse<Page<Order>>>(
        `/orders/store/${storeId}?${queryParams.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<Order>>(`/orders/${orderId}`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(storeId?: string): Promise<OrderStats> {
    try {
      const id = storeId || 'me';
      const { data } = await axiosInstance.get<ApiResponse<OrderStats>>(`/orders/store/${id}/stats`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Confirm order (PENDING → CONFIRMED)
   */
  async confirmOrder(orderId: string, request?: ConfirmOrderRequest): Promise<Order> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>(
        `/orders/${orderId}/confirm`,
        request || {}
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Start preparing order (CONFIRMED → PREPARING)
   */
  async prepareOrder(orderId: string): Promise<Order> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>(`/orders/${orderId}/prepare`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Start shipping order (PREPARING → SHIPPING)
   */
  async shipOrder(orderId: string, request?: ShipOrderRequest): Promise<Order> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>(
        `/orders/${orderId}/ship`,
        request || {}
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deliver order (SHIPPING → DELIVERED)
   */
  async deliverOrder(orderId: string): Promise<Order> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>(`/orders/${orderId}/deliver`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, request: CancelOrderRequest): Promise<Order> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>(
        `/orders/${orderId}/cancel`,
        request
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Format currency to VND
   */
  formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  /**
   * Get status color
   */
  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-purple-100 text-purple-800',
      SHIPPING: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      RETURNED: 'bg-orange-100 text-orange-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status label
   */
  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PREPARING: 'Đang chuẩn bị',
      SHIPPING: 'Đang giao hàng',
      DELIVERED: 'Đã giao hàng',
      CANCELLED: 'Đã hủy',
      RETURNED: 'Đã trả hàng',
      REFUNDED: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  }

  /**
   * Get payment status label
   */
  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      FAILED: 'Thanh toán thất bại',
      REFUNDED: 'Đã hoàn tiền',
    };
    return labels[status] || status;
  }

  /**
   * Get payment method label
   */
  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      COD: 'Thanh toán khi nhận hàng',
      BANK_TRANSFER: 'Chuyển khoản ngân hàng',
      VNPAY: 'VNPay',
      MOMO: 'Momo',
      ZALOPAY: 'ZaloPay',
    };
    return labels[method] || method;
  }

  /**
   * Get next status for order
   */
  getNextStatus(currentStatus: OrderStatus): OrderStatus | null {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'SHIPPING',
      SHIPPING: 'DELIVERED',
      DELIVERED: null,
      CANCELLED: null,
      RETURNED: null,
      REFUNDED: null,
    };
    return flow[currentStatus];
  }

  /**
   * Get next action label
   */
  getNextActionLabel(currentStatus: OrderStatus): string | null {
    const labels: Record<OrderStatus, string | null> = {
      PENDING: 'Xác nhận đơn',
      CONFIRMED: 'Bắt đầu chuẩn bị',
      PREPARING: 'Bắt đầu giao hàng',
      SHIPPING: 'Xác nhận đã giao',
      DELIVERED: null,
      CANCELLED: null,
      RETURNED: null,
      REFUNDED: null,
    };
    return labels[currentStatus];
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(status: OrderStatus): boolean {
    return ['PENDING', 'CONFIRMED', 'PREPARING'].includes(status);
  }
}

// Export singleton instance
export default new SupplierOrderService();
