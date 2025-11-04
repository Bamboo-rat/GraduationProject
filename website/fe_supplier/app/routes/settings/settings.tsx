import type { Route } from './+types/settings';
import Settings from '~/pages/settings/Settings';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cài đặt - SaveFood' },
    { name: 'description', content: 'Cài đặt chung của nhà cung cấp' },
  ];
}

export default function SettingsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <Settings />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
