import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import inAppNotificationService from '~/service/inAppNotificationService';
import type { InAppNotification } from '~/service/inAppNotificationService';
import { useNavigate } from 'react-router';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await inAppNotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Fetch notifications when dropdown is opened
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await inAppNotificationService.getMyNotifications(0, 10);
      console.log('Fetched notifications:', data);
      console.log('Notifications content:', data?.content);
      setNotifications(data.content || []);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      console.error('Error details:', error.response?.data);
      alert('Lỗi khi tải thông báo: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification: InAppNotification) => {
    try {
      if (!notification.isRead) {
        await inAppNotificationService.markAsRead(notification.notificationId);
        setNotifications(prev =>
          prev.map(n =>
            n.notificationId === notification.notificationId
              ? { ...n, isRead: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      if (notification.linkUrl) {
        try {
          navigate(notification.linkUrl);
          setIsOpen(false);
        } catch (navError) {
          console.error('Navigation error:', navError);
          // If navigation fails, just close the dropdown
          setIsOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await inAppNotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-[#2D2D2D] hover:text-[#2F855A] hover:bg-[#F8FFF9] rounded-full transition-all duration-200 group"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#E63946] rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-surface rounded-lg shadow-lg border border-default z-50 animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-default bg-surface-light rounded-t-lg">
            <div>
              <h3 className="text-lg font-semibold text-text">Thông báo</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-muted mt-1">
                  {unreadCount} thông báo chưa đọc
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-[#2F855A] hover:text-[#8FB491] flex items-center gap-1 transition-colors px-3 py-1 rounded-md hover:bg-[#E8FFED]"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đọc tất cả
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#6B6B6B] hover:text-[#E63946] p-1 rounded-full hover:bg-[#F5EDE6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F855A] mb-2"></div>
                <p className="text-light">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <Bell className="w-12 h-12 text-light mb-3 opacity-50" />
                <p className="text-light text-lg">Không có thông báo</p>
                <p className="text-muted text-sm mt-1">Các thông báo mới sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="divide-y divide-[#B7E4C7]">
                {notifications.map(notification => (
                  <div
                    key={notification.notificationId}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 cursor-pointer transition-all duration-200 group ${
                      !notification.isRead 
                        ? 'bg-[#E8FFED] hover:bg-[#D9FFDF] border-l-4 border-[#2F855A]' 
                        : 'bg-surface hover:bg-surface-light opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className={`mt-1 p-1 rounded-full ${
                        !notification.isRead 
                          ? 'bg-[#2F855A] text-white' 
                          : 'bg-[#F5EDE6] text-[#6B6B6B]'
                      }`}>
                        {notification.isRead ? (
                          <CheckCheck className="w-3 h-3" />
                        ) : (
                          <div className="w-3 h-3 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${
                          !notification.isRead 
                            ? 'font-semibold text-text' 
                            : 'font-normal text-text'
                        }`}>
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            !notification.isRead 
                              ? 'badge-success' 
                              : 'badge-neutral'
                          }`}>
                            {notification.typeDisplayName}
                          </span>
                          <span className="text-xs text-light">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Hover Action */}
                      {!notification.isRead && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-2 h-2 bg-[#2F855A] rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-default bg-surface-light rounded-b-lg text-center">
              <button
                onClick={() => {
                  navigate('/profile/notifications');
                  setIsOpen(false);
                }}
                className="text-sm text-[#2F855A] hover:text-[#8FB491] font-medium flex items-center justify-center gap-2 w-full py-2 rounded-md hover:bg-[#E8FFED] transition-colors"
              >
                Xem tất cả thông báo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;