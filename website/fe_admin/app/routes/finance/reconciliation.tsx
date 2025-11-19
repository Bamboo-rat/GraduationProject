import type { Route } from './+types/reconciliation';
import FinanceReconciliation from '~/pages/finance/FinanceReconciliation';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Đối soát tài chính - SaveFood' },
    { name: 'description', content: 'Quản lý đối soát tài chính' },
  ];
}

export default function FinanceReconciliationRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN']}>
      <FinanceReconciliation />
    </ProtectedRoute>
  );
}
