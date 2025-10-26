import type { Route } from "./+types/update-request";
import StoreUpdateRequest from "~/pages/store/StoreUpdateRequest";
import DashboardLayout from "~/component/layout/DashboardLayout";
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Yêu cầu cập nhật cửa hàng - SaveFood" },
    { name: "description", content: "Gửi yêu cầu cập nhật thông tin cửa hàng" },
  ];
}

export default function StoreUpdateRequestRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <StoreUpdateRequest />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
