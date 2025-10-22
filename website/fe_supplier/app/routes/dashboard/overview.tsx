import type { Route } from './+types/overview';
import DashboardOverview from '~/pages/dashboard/DashboardOverview';
import DashboardLayout from '~/component/DashboardLayout';
import ProtectedRoute from '~/component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tổng quan doanh thu - SaveFood' },
    { name: 'description', content: 'Tổng quan doanh thu' },
  ];
}

export default function DashboardOverviewRoute() {
  return (
    <ProtectedRoute requireRoles={['SUPPLIER']}>
      <DashboardLayout>
        <DashboardOverview />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
