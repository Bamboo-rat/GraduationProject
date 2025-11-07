import type { Route } from './+types/waste';
import WasteReport from '~/pages/reports/WasteReport';
import ProtectedRoute from '~/component/common/ProtectedRoute';
import DashboardLayout from '~/component/layout/DashboardLayout';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý lãng phí - SaveFood' },
    { name: 'description', content: 'Quản lý lãng phí sản phẩm' },
  ];
}

export default function WasteRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <DashboardLayout>
        <WasteReport />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
