import type { Route } from './+types/profile';
import StoreProfile from '~/pages/store/StoreProfile';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Thông tin Cửa hàng - SaveFood' },
    { name: 'description', content: 'Trang thông tin chi tiết cửa hàng' },
  ];
}

export default function StoreProfileRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <StoreProfile />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
