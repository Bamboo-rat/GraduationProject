import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import notificationService  from '~/service/notificationService';
import type { PendingNotification, NotificationStats } from '~/service/notificationService';

type TabType = 'failed' | 'pending';

export default function NotificationManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('failed');
  const [notifications, setNotifications] = useState<PendingNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAll, setProcessingAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats
      const statsData = await notificationService.getNotificationStats();
      setStats(statsData);

      // Fetch notifications based on active tab
      if (activeTab === 'failed') {
        const failedData = await notificationService.getFailedNotifications();
        setNotifications(failedData);
      } else {
        const pendingData = await notificationService.getPendingNotifications();
        setNotifications(pendingData);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryNotification = async (notificationId: string) => {
    if (!confirm('Bạn có chắc muốn thử lại gửi thông báo này?')) {
      return;
    }

    try {
      await notificationService.retryNotification(notificationId);
      alert('Đã gửi yêu cầu thử lại thành công');
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Không thể thử lại gửi thông báo');
    }
  };

  const handleProcessAll = async () => {
    if (!confirm('Bạn có chắc muốn xử lý tất cả thông báo đang chờ?')) {
      return;
    }

    try {
      setProcessingAll(true);
      const result = await notificationService.processPendingNotifications();
      alert(`Đã xử lý thành công ${result.processedCount} thông báo`);
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.message || 'Không thể xử lý thông báo');
    } finally {
      setProcessingAll(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      PROCESSING: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
      SENT: { label: 'Đã gửi', className: 'bg-green-100 text-green-800' },
      FAILED: { label: 'Thất bại', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getNotificationTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      EMAIL_VERIFICATION: 'Xác thực email',
      PASSWORD_RESET: 'Đặt lại mật khẩu',
      WELCOME_EMAIL: 'Chào mừng',
      ORDER_CONFIRMATION: 'Xác nhận đơn hàng',
      SUPPLIER_APPROVAL: 'Duyệt nhà cung cấp',
      STORE_APPROVAL: 'Duyệt cửa hàng',
    };

    return typeLabels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !stats) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Quản lý Thông báo Email</h1>
            <p className="text-gray-600">Giám sát và quản lý hệ thống gửi email</p>
          </div>
          <button
            onClick={handleProcessAll}
            disabled={processingAll || !stats || stats.pending === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingAll ? 'Đang xử lý...' : 'Xử lý tất cả'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Chờ xử lý</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đang xử lý</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Đã gửi</p>
                  <p className="text-3xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Thất bại</p>
                  <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('failed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'failed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Thông báo thất bại ({stats?.failed || 0})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Thông báo chờ xử lý ({stats?.pending || 0})
              </button>
            </nav>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {activeTab === 'failed' ? 'Không có thông báo thất bại' : 'Không có thông báo chờ xử lý'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người nhận
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lần thử
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{notification.recipientEmail}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{notification.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getNotificationTypeLabel(notification.notificationType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(notification.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {notification.retryCount} / {notification.maxRetries}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(notification.createdAt)}</div>
                        {notification.sentAt && (
                          <div className="text-xs text-gray-500">Gửi: {formatDate(notification.sentAt)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {activeTab === 'failed' && notification.retryCount < notification.maxRetries && (
                          <button
                            onClick={() => handleRetryNotification(notification.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Thử lại
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Error Details (for failed notifications) */}
        {activeTab === 'failed' && notifications.some((n) => n.lastError) && (
          <div className="mt-6 bg-red-50 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-red-800 mb-4">Chi tiết lỗi gần nhất</h3>
            <div className="space-y-3">
              {notifications
                .filter((n) => n.lastError)
                .map((notification) => (
                  <div key={notification.id} className="bg-white rounded p-3 border border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {notification.recipientEmail}
                        </div>
                        <div className="text-sm text-red-600">{notification.lastError}</div>
                      </div>
                      <button
                        onClick={() => handleRetryNotification(notification.id)}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Thử lại
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
