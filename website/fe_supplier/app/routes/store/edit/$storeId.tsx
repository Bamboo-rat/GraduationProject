import type { Route } from './+types/$storeId';
import StoreUpdateForm from '~/pages/store/StoreUpdateForm';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chỉnh sửa Cửa hàng - SaveFood' },
    { name: 'description', content: 'Chỉnh sửa thông tin cửa hàng' },
  ];
}

export default function StoreEditRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <StoreUpdateForm />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
