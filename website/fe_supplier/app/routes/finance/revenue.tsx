import type { Route } from './+types/revenue';
import FinanceRevenue from '~/pages/finance/FinanceRevenue';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';


export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Doanh thu & Hoa hồng - SaveFood' },
    { name: 'description', content: 'Quản lý doanh thu và hoa hồng' },
  ];
}

export default function FinanceRevenueRoute() {
  return (
    <ProtectedRoute requireRoles={['SUPPLIER']}>
      <DashboardLayout>
        <FinanceRevenue />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
