import type { Route } from './+types/list';
import OrdersList from '~/pages/orders/OrdersList';
import DashboardLayout from '~/component/DashboardLayout';
import ProtectedRoute from '~/component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tất cả đơn hàng - SaveFood' },
    { name: 'description', content: 'Quản lý đơn hàng' },
  ];
}

export default function OrdersListRoute() {
  return (
    <ProtectedRoute requireRoles={['SUPPLIER']}>
      <DashboardLayout>
        <OrdersList />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
