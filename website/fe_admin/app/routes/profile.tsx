import type { Route } from './+types/profile';
import { Profile } from '../pages/profile';
import DashboardLayout from '../component/DashboardLayout';
import ProtectedRoute from '../component/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Thông tin cá nhân - FoodSave Admin' },
    { name: 'description', content: 'Quản lý thông tin và cài đặt tài khoản cá nhân' },
  ];
}

export default function ProfileRoute() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Profile />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
