import type { Route } from './+types/transactions';
import FinanceTransactions from '~/pages/finance/FinanceTransactions';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Giao dịch thanh toán - SaveFood' },
    { name: 'description', content: 'Lịch sử giao dịch thanh toán' },
  ];
}

export default function FinanceTransactionsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <FinanceTransactions />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
