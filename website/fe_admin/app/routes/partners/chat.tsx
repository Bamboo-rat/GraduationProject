import type { Route } from './+types/chat';
import SupportPartners from '~/pages/partners/SupportPartners';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Hỗ trợ nhà cung cấp - SaveFood' },
    { name: 'description', content: 'Chat và hỗ trợ nhà cung cấp' },
  ];
}

export default function SupportPartnersRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <SupportPartners />
    </ProtectedRoute>
  );
}
