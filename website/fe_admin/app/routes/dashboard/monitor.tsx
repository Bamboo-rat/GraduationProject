import type { Route } from './+types/monitor';
import SystemMonitor from '~/pages/dashboard/SystemMonitor';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Giám sát hệ thống - SaveFood' },
    { name: 'description', content: 'Quản lý giám sát hệ thống' },
  ];
}

export default function SystemMonitorRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <SystemMonitor />
    </ProtectedRoute>
  );
}
