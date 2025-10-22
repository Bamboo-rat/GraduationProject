import type { Route } from './+types/marketing';
import MarketingSettings from '~/pages/settings/MarketingSettings';
import ProtectedRoute from '~/component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý marketing - SaveFood' },
    { name: 'description', content: 'Quản lý marketing sản phẩm' },
  ];
}

export default function MarketingRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <MarketingSettings />
    </ProtectedRoute>
  );
}
