import type { Route } from './+types/transactions';
import FinanceTransactions from '~/pages/finance/FinanceTransactions';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Giao dịch tài chính - SaveFood' },
    { name: 'description', content: 'Quản lý giao dịch tài chính' },
  ];
}

export default function FinanceTransactionsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <FinanceTransactions />
    </ProtectedRoute>
  );
}
