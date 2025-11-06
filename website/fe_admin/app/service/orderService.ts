import axiosInstance from '../config/axios';
import type { ApiResponse, PageResponse } from './types';

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

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
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

// Admin Order Service
class AdminOrderService {
  private handleError(error: any): Error {
    return new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }

  /**
   * Get all orders (Admin)
   */
  async getAllOrders(params?: {
    status?: OrderStatus;
    storeId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<PageResponse<Order>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());

      const { data } = await axiosInstance.get<ApiResponse<PageResponse<Order>>>(
        `/orders/all?${queryParams.toString()}`
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
   * Get order by code
   */
  async getOrderByCode(orderCode: string): Promise<Order> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<Order>>(`/orders/code/${orderCode}`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update order status (Admin)
   */
  async updateOrderStatus(orderId: string, request: UpdateOrderStatusRequest): Promise<Order> {
    try {
      const { data } = await axiosInstance.put<ApiResponse<Order>>(
        `/orders/${orderId}/status`,
        request
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Confirm order
   */
  async confirmOrder(orderId: string): Promise<Order> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>(`/orders/${orderId}/confirm`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Start preparing order
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
   * Start shipping order
   */
  async shipOrder(orderId: string, trackingNumber: string, shippingProvider: string): Promise<Order> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('trackingNumber', trackingNumber);
      queryParams.append('shippingProvider', shippingProvider);

      const { data } = await axiosInstance.post<ApiResponse<Order>>(
        `/orders/${orderId}/ship?${queryParams.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered(orderId: string): Promise<Order> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<Order>>(`/orders/${orderId}/deliver`);
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get orders by date range
   */
  async getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);

      const { data } = await axiosInstance.get<ApiResponse<Order[]>>(
        `/orders/date-range?${queryParams.toString()}`
      );
      return data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Process refund (Admin)
   */
  async processRefund(orderId: string): Promise<void> {
    try {
      await axiosInstance.post(`/orders/${orderId}/refund`);
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
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format date short
   */
  formatDateShort(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
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
   * Check if can update to status
   */
  canUpdateToStatus(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['SHIPPING', 'CANCELLED'],
      SHIPPING: ['DELIVERED'],
      DELIVERED: ['RETURNED'],
      CANCELLED: ['REFUNDED'],
      RETURNED: ['REFUNDED'],
      REFUNDED: [],
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Get available status transitions
   */
  getAvailableStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['SHIPPING', 'CANCELLED'],
      SHIPPING: ['DELIVERED'],
      DELIVERED: ['RETURNED'],
      CANCELLED: ['REFUNDED'],
      RETURNED: ['REFUNDED'],
      REFUNDED: [],
    };
    return validTransitions[currentStatus] || [];
  }
}

// Export singleton instance
export default new AdminOrderService();
