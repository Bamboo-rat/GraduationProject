import type { Route } from './+types/list';
import PromotionList from '~/pages/promotions/PromotionList';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Danh sách Khuyến mãi - SaveFood' },
    { name: 'description', content: 'Xem danh sách khuyến mãi có sẵn' },
  ];
}

export default function PromotionListRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <PromotionList />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
