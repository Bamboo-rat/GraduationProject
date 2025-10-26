import type { Route } from "./+types/update-history";
import StoreUpdateHistory from "~/pages/store/StoreUpdateHistory";
import DashboardLayout from "~/component/layout/DashboardLayout";
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lịch sử cập nhật - SaveFood" },
    { name: "description", content: "Lịch sử yêu cầu cập nhật cửa hàng" },
  ];
}

export default function StoreUpdateHistoryRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <StoreUpdateHistory />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
