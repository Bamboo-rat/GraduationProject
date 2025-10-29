import type { Route } from './+types/banners';
import BannerManagement from '~/pages/marketing/BannerManagement';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý Banner - SaveFood' },
    { name: 'description', content: 'Quản lý banner trên trang web' },
  ];
}

export default function BannerRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <BannerManagement />
    </ProtectedRoute>
  );
}
