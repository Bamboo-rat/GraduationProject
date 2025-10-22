import type { Route } from './+types/store-pending-updates';
import StorePendingUpdatesPage from "~/pages/partners/StorePendingUpdates";
import ProtectedRoute from "~/component/ProtectedRoute";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Cập nhật cửa hàng - SaveFood" },
    { name: "description", content: "Quản lý cập nhật thông tin cửa hàng" },
  ];
}

export default function StorePendingUpdates() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <StorePendingUpdatesPage />
    </ProtectedRoute>
  );
}
