import type { Route } from './+types/list';
import OrdersList from '~/pages/orders/OrdersList';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Danh sách Đơn hàng - SaveFood' },
    { name: 'description', content: 'Quản lý danh sách đơn hàng' },
  ];
}

export default function OrdersListRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <OrdersList />
    </ProtectedRoute>
  );
}
