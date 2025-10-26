import type { Route } from './+types/tracking';
import DeliveryTracking from '~/pages/delivery/DeliveryTracking';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Theo dõi giao hàng - SaveFood' },
    { name: 'description', content: 'Theo dõi trạng thái giao hàng' },
  ];
}

export default function DeliveryTrackingRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <DeliveryTracking />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
