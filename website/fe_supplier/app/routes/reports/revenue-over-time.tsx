import type { Route } from './+types/revenue-over-time';
import RevenueOverTime from '~/pages/reports/RevenueOverTime';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Doanh thu theo thời gian - SaveFood' },
    { name: 'description', content: 'Báo cáo doanh thu theo thời gian' },
  ];
}

export default function RevenueOverTimeRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <RevenueOverTime />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
