import type { Route } from './+types/promotions';
import PromotionsManagement from '~/pages/marketing/PromotionsManagement';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý Khuyến mãi - SaveFood' },
    { name: 'description', content: 'Quản lý mã khuyến mãi và chương trình giảm giá' },
  ];
}

export default function PromotionsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <PromotionsManagement />
    </ProtectedRoute>
  );
}
