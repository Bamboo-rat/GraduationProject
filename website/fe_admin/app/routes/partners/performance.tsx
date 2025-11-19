import type { Route } from './+types/performance';
import PartnersPerformance from '~/pages/partners/PartnersPerformance';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Yêu cầu cần duyệt - SaveFood' },
    { name: 'description', content: 'Duyệt yêu cầu đối tác' },
  ];
}

export default function PerformanceRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR']}>
      <PartnersPerformance />
    </ProtectedRoute>
  );
}
