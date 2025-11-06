import OrderDetail from '~/pages/orders/OrderDetail';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta() {
  return [
    { title: 'Chi tiết Đơn hàng - SaveFood' },
    { name: 'description', content: 'Chi tiết đơn hàng' },
  ];
}

export default function OrderDetailRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <OrderDetail />
    </ProtectedRoute>
  );
}
