import axiosInstance from '../config/axios';
import type { ApiResponse } from './types';

export interface InAppNotification {
  notificationId: string;
  content: string;
  type: string;
  typeDisplayName: string;
  linkUrl: string | null;
  isRead: boolean;
  isBroadcast: boolean;
  createdAt: string;
}

export interface NotificationPage {
  content: InAppNotification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * In-App Notification Service
 * Handles notification bar notifications for the website
 */
class InAppNotificationService {
  /**
   * Get all notifications for current user
   */
  async getMyNotifications(page: number = 0, size: number = 20): Promise<NotificationPage> {
    console.log('Calling getMyNotifications API with params:', { page, size });
    const response = await axiosInstance.get<ApiResponse<NotificationPage>>('/notifications', {
      params: { page, size }
    });
    console.log('API Response:', response.data);
    return response.data.data;
  }

  /**
   * Get unread notifications for current user
   */
  async getUnreadNotifications(page: number = 0, size: number = 20): Promise<NotificationPage> {
    const response = await axiosInstance.get<ApiResponse<NotificationPage>>('/notifications/unread', {
      params: { page, size }
    });
    return response.data.data;
  }

  /**
   * Get unread notification count for badge display
   */
  async getUnreadCount(): Promise<number> {
    const response = await axiosInstance.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return response.data.data.unreadCount;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await axiosInstance.patch<ApiResponse<string>>(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    const response = await axiosInstance.post<ApiResponse<{ markedCount: number }>>('/notifications/mark-all-read');
    return response.data.data.markedCount;
  }
}

export default new InAppNotificationService();
