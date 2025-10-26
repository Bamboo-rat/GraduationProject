import axiosInstance from '../config/axios';
import { ApiResponse } from './types';

export interface PendingNotification {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  notificationType: string; // EMAIL_VERIFICATION, PASSWORD_RESET, etc.
  status: string; // PENDING, PROCESSING, SENT, FAILED
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

export interface NotificationStats {
  pending: number;
  sent: number;
  failed: number;
  processing: number;
}

/**
 * Notification Service for Admin Portal
 * Handles email notification monitoring and management
 */
class NotificationService {
  /**
   * Get all failed notifications
   * Endpoint: GET /api/admin/notifications/failed
   */
  async getFailedNotifications(): Promise<PendingNotification[]> {
    const response = await axiosInstance.get<ApiResponse<PendingNotification[]>>(
      '/admin/notifications/failed'
    );
    return response.data.data;
  }

  /**
   * Get all pending notifications
   * Endpoint: GET /api/admin/notifications/pending
   */
  async getPendingNotifications(): Promise<PendingNotification[]> {
    const response = await axiosInstance.get<ApiResponse<PendingNotification[]>>(
      '/admin/notifications/pending'
    );
    return response.data.data;
  }

  /**
   * Get notification statistics
   * Endpoint: GET /api/admin/notifications/stats
   */
  async getNotificationStats(): Promise<NotificationStats> {
    const response = await axiosInstance.get<ApiResponse<NotificationStats>>(
      '/admin/notifications/stats'
    );
    return response.data.data;
  }

  /**
   * Manually retry a failed notification
   * Endpoint: POST /api/admin/notifications/{notificationId}/retry
   */
  async retryNotification(notificationId: string): Promise<string> {
    const response = await axiosInstance.post<ApiResponse<string>>(
      `/admin/notifications/${notificationId}/retry`
    );
    return response.data.data;
  }

  /**
   * Process all pending notifications manually (Super Admin only)
   * Endpoint: POST /api/admin/notifications/process
   */
  async processPendingNotifications(): Promise<{ processedCount: number }> {
    const response = await axiosInstance.post<ApiResponse<{ processedCount: number }>>(
      '/admin/notifications/process'
    );
    return response.data.data;
  }
}

export default new NotificationService();
