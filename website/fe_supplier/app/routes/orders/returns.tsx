import type { Route } from './+types/returns';
import OrdersReturns from '~/pages/orders/OrdersReturns';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Đơn hàng trả lại - SaveFood' },
    { name: 'description', content: 'Quản lý đơn hàng trả lại' },
  ];
}

export default function OrdersReturnsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <OrdersReturns />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
