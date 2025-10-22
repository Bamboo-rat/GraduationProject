import type { Route } from './+types/orders';
import RecentOrders from '~/pages/dashboard/RecentOrders';
import DashboardLayout from '~/component/DashboardLayout';
import ProtectedRoute from '~/component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Đơn hàng gần đây - SaveFood' },
    { name: 'description', content: 'Đơn hàng gần đây' },
  ];
}

export default function RecentOrdersRoute() {
  return (
    <ProtectedRoute requireRoles={['SUPPLIER']}>
      <DashboardLayout>
        <RecentOrders />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
