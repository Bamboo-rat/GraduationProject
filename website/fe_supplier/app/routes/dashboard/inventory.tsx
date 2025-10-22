import type { Route } from './+types/inventory';
import InventoryAlert from '~/pages/dashboard/InventoryAlert';
import DashboardLayout from '~/component/DashboardLayout';
import ProtectedRoute from '~/component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Cảnh báo tồn kho - SaveFood' },
    { name: 'description', content: 'Cảnh báo tồn kho' },
  ];
}

export default function InventoryAlertRoute() {
  return (
    <ProtectedRoute requireRoles={['SUPPLIER']}>
      <DashboardLayout>
        <InventoryAlert />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
