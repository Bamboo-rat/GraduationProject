import type { Route } from './+types/$orderId';
import OrderDetail from '~/pages/orders/OrderDetail';
import DashboardLayout from '~/component/layout/DashboardLayout';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Chi tiết đơn hàng - Nhà cung cấp' },
    { name: 'description', content: 'Xem chi tiết đơn hàng' },
  ];
}

// Loader removed: SSR cannot access localStorage for auth token
// Data fetching moved to client-side in OrderDetail component

export default function OrderDetailRoute() {
  return (
    <DashboardLayout>
      <OrderDetail />
    </DashboardLayout>
  );
}
