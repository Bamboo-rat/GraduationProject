import type { Route } from './+types/admins';
import AdminManagement from '~/pages/employees/AdminManagement';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý Admin - SaveFood' },
    { name: 'description', content: 'Quản lý Admin và Nhân viên' },
  ];
}

export default function AdminManagementRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <AdminManagement />
    </ProtectedRoute>
  );
}
