import type { Route } from './+types/audit';
import AuditLog from '~/pages/settings/AuditLog';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý nhật ký - SaveFood' },
    { name: 'description', content: 'Quản lý nhật ký hệ thống' },
  ];
}

export default function AuditRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR']}>
      <AuditLog />
    </ProtectedRoute>
  );
}
