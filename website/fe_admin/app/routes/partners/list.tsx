import type { Route } from './+types/list';
import PartnersList from '~/pages/partners/PartnersList';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Danh sách Đối tác - SaveFood' },
    { name: 'description', content: 'Quản lý danh sách đối tác' },
  ];
}

export default function PartnersListRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <PartnersList />
    </ProtectedRoute>
  );
}
