import type { Route } from './+types/notifications';
import NotificationSettings from '~/pages/settings/NotificationSettings';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cấu hình thông báo - SaveFood' },
    { name: 'description', content: 'Cấu hình thông báo hệ thống' },
  ];
}

export default function NotificationSettingsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <NotificationSettings />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
