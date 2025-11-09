import axiosInstance from '../config/axios';
import type { ApiResponse, Page } from './types';

// Return Request Types
export interface ReturnRequestResponse {
  returnRequestId: string;
  orderId: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  storeId: string;
  storeName: string;

  reason: string;
  reasonDetail?: string;
  images?: string[];

  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  reviewedBy?: string;
  reviewerName?: string;
  reviewComment?: string;
  reviewedAt?: string;

  requestedAt: string;
  completedAt?: string;

  refundAmount: number;
  items: ReturnItem[];
}

export interface ReturnItem {
  productId: string;
  productName: string;
  variantId: string;
  variantName?: string;
  quantity: number;
  price: number;
  subtotal: number;
  imageUrl?: string;
}

export interface ReviewReturnRequestRequest {
  reviewComment?: string;
}

class ReturnRequestService {
  private handleError(error: any): Error {
    return new Error(error.response?.data?.message || error.message || 'An unexpected error occurred');
  }

  /**
   * Get return requests for supplier's stores
   */
  async getMyStoresRequests(params?: {
    pending?: boolean;
    page?: number;
    size?: number;
  }): Promise<Page<ReturnRequestResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.pending !== undefined) queryParams.append('pending', params.pending.toString());
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());

      const { data } = await axiosInstance.get<Page<ReturnRequestResponse>>(
        `/return-requests/my-stores-requests?${queryParams.toString()}`
      );
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get return requests for a specific store
   */
  async getStoreReturnRequests(storeId: string, params?: {
    pending?: boolean;
    page?: number;
    size?: number;
  }): Promise<Page<ReturnRequestResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.pending !== undefined) queryParams.append('pending', params.pending.toString());
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size) queryParams.append('size', params.size.toString());

      const { data } = await axiosInstance.get<Page<ReturnRequestResponse>>(
        `/return-requests/store/${storeId}?${queryParams.toString()}`
      );
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get return request by ID
   */
  async getReturnRequestById(returnRequestId: string): Promise<ReturnRequestResponse> {
    try {
      const { data } = await axiosInstance.get<ReturnRequestResponse>(
        `/return-requests/${returnRequestId}`
      );
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get return request by order ID
   */
  async getReturnRequestByOrderId(orderId: string): Promise<ReturnRequestResponse> {
    try {
      const { data } = await axiosInstance.get<ReturnRequestResponse>(
        `/return-requests/order/${orderId}`
      );
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Approve return request
   */
  async approveReturnRequest(
    returnRequestId: string,
    request: ReviewReturnRequestRequest
  ): Promise<ReturnRequestResponse> {
    try {
      const { data } = await axiosInstance.post<ReturnRequestResponse>(
        `/return-requests/${returnRequestId}/approve`,
        request
      );
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reject return request
   */
  async rejectReturnRequest(
    returnRequestId: string,
    request: ReviewReturnRequestRequest
  ): Promise<ReturnRequestResponse> {
    try {
      const { data } = await axiosInstance.post<ReturnRequestResponse>(
        `/return-requests/${returnRequestId}/reject`,
        request
      );
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Chờ xử lý',
      'APPROVED': 'Đã chấp nhận',
      'REJECTED': 'Từ chối',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
    };
    return labels[status] || status;
  }

  /**
   * Format currency
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
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  /**
   * Format datetime
   */
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }
}

export default new ReturnRequestService();
