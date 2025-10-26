import type { Route } from './+types/$userId';
import CustomerDetail from '~/pages/customers/CustomerDetail';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chi tiết Khách hàng - SaveFood' },
    { name: 'description', content: 'Xem chi tiết thông tin khách hàng' },
  ];
}

export default function CustomerDetailRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <CustomerDetail />
    </ProtectedRoute>
  );
}
