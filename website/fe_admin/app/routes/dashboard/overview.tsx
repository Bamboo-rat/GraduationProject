import type { Route } from './+types/overview';
import DashboardOverview from '~/pages/dashboard/DashboardOverview';
import ProtectedRoute from '~/component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tổng quan - SaveFood' },
    { name: 'description', content: 'Quản lý tổng quan' },
  ];
}

export default function DashboardOverviewRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <DashboardOverview />
    </ProtectedRoute>
  );
}
