import type { Route } from './+types/withdraw';
import FinanceWithdraw from '~/pages/finance/FinanceWithdraw';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Rút tiền / Đối soát - SaveFood' },
    { name: 'description', content: 'Yêu cầu rút tiền và đối soát' },
  ];
}

export default function FinanceWithdrawRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <FinanceWithdraw />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
