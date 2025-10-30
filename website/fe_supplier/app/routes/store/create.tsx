import type { Route } from './+types/create';
import StoreForm from '~/pages/store/StoreUpdateForm';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Tạo Cửa hàng - SaveFood' },
    { name: 'description', content: 'Tạo cửa hàng mới' },
  ];
}

export default function StoreCreateRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <StoreForm />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
