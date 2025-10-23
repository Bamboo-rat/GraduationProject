import type { Route } from './+types/list';
import CustomersList from '~/pages/customers/CustomersList';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Danh sách Đối tác - SaveFood' },
    { name: 'description', content: 'Quản lý danh sách đối tác' },
  ];
}

export default function CustomersListRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <CustomersList />
    </ProtectedRoute>
  );
}
