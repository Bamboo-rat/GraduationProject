import type { Route } from './+types/list-customers';
import CustomersList from '~/pages/customers/CustomersList';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Danh sách Khách hàng - SaveFood' },
    { name: 'description', content: 'Quản lý danh sách khách hàng' },
  ];
}

export default function CustomersListRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <CustomersList />
    </ProtectedRoute>
  );
}
