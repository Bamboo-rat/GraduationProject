import type { Route } from './+types/behavior';
import CustomerBehavior from '~/pages/reports/CustomerBehavior';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý Hành vi Khách hàng - SaveFood' },
    { name: 'description', content: 'Quản lý hành vi khách hàng' },
  ];
}

export default function BehaviorRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <CustomerBehavior />
    </ProtectedRoute>
  );
}
