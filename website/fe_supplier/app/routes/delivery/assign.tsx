import type { Route } from './+types/assign';
import DeliveryAssign from '~/pages/delivery/DeliveryAssign';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Gán đơn hàng - SaveFood' },
    { name: 'description', content: 'Gán đơn hàng cho người giao hàng' },
  ];
}

export default function DeliveryAssignRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <DeliveryAssign />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
