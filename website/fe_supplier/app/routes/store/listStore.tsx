import type { Route } from './+types/listStore';
import StoreManagement from '~/pages/store/StoreManagement';
import DashboardLayout from '~/component/layout/DashboardLayout';
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Quản lý Cửa hàng - SaveFood' },
    { name: 'description', content: 'Quản lý danh sách cửa hàng của bạn' },
  ];
}

export default function StoreListRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <StoreManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
