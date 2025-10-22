import type { Route } from './+types/performance';
import PartnersPending from '~/pages/partners/PartnersPending';
import ProtectedRoute from '~/component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Yêu cầu cần duyệt - SaveFood' },
    { name: 'description', content: 'Duyệt yêu cầu đối tác' },
  ];
}

export default function PerformanceRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <PartnersPending />
    </ProtectedRoute>
  );
}
