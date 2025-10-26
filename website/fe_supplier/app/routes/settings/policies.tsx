import type { Route } from './+types/policies';
import PoliciesSettings from '~/pages/settings/PoliciesSettings';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tài liệu & Chính sách - SaveFood' },
    { name: 'description', content: 'Xem tài liệu và chính sách' },
  ];
}

export default function PoliciesSettingsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <PoliciesSettings />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
