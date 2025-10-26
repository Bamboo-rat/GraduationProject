import type { Route } from './+types/my-profile';
import Profile from '~/pages/profile/Profile';
import DashboardLayout from "~/component/layout/DashboardLayout";
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Thông tin nhà cung cấp - SaveFood' },
    { name: 'description', content: 'Thông tin chi tiết về nhà cung cấp' },
  ];
}

export default function ProfileRoute() {
   return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <Profile />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
