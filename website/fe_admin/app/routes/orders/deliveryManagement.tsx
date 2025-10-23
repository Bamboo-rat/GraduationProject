import type { Route } from './+types/deliveryManagement';
import DeliveryManagement from '~/pages/orders/DeliveryManagement';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý giao hàng - SaveFood' },
    { name: 'description', content: 'Quản lý danh sách giao hàng' },
  ];
}

export default function DeliveryManagementRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <DeliveryManagement />
    </ProtectedRoute>
  );
}
