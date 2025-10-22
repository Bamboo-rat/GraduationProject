import type { Route } from './+types/pending';
import PartnersPending from '~/pages/partners/PartnersPending';
import ProtectedRoute from '~/component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Danh sách Đối tác - SaveFood' },
    { name: 'description', content: 'Quản lý danh sách đối tác' },
  ];
}

export default function PartnersPendingRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <PartnersPending />
    </ProtectedRoute>
  );
}
