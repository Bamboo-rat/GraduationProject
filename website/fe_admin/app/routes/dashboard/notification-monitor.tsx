import type { Route } from './+types/notification-monitor';
import NotificationManagement from '~/pages/notifications/NotificationManagement';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Giám sát Email - SaveFood' },
    { name: 'description', content: 'Giám sát và quản lý hệ thống gửi email' },
  ];
}

export default function NotificationMonitorRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR']}>
      <NotificationManagement />
    </ProtectedRoute>
  );
}
