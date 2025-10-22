import type { Route } from './+types/notifications';
import NotificationsSettings from '~/pages/settings/NotificationsSettings';
import ProtectedRoute from '~/component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý thông báo - SaveFood' },
    { name: 'description', content: 'Quản lý thông báo hệ thống' },
  ];
}

export default function NotificationsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <NotificationsSettings />
    </ProtectedRoute>
  );
}
