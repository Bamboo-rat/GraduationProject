import type { Route } from './+types/roles';
import RolesManagement from '~/pages/settings/RolesManagement';
import ProtectedRoute from '~/component/ProtectedRoute';
import WasteReport from '~/pages/reports/WasteReport';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý vai trò - SaveFood' },
    { name: 'description', content: 'Quản lý vai trò người dùng' },
  ];
}

export default function RolesRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <RolesManagement />
    </ProtectedRoute>
  );
}
