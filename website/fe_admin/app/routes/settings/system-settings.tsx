import type { Route } from './+types/system-settings';
import SystemSettings from '~/pages/settings/SystemSettings';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cấu hình hệ thống - SaveFood' },
    { name: 'description', content: 'Cấu hình hệ thống' },
  ];
}

export default function SystemSettingsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <SystemSettings />
    </ProtectedRoute>
  );
}
