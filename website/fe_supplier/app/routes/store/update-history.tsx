import type { Route } from "./+types/update-history";
import UpdateHistory from "~/pages/store/UpdateHistory";
import DashboardLayout from "~/component/layout/DashboardLayout";
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lịch sử yêu cầu cập nhật - SaveFood" },
    { name: "description", content: "Lịch sử yêu cầu cập nhật cửa hàng và thông tin doanh nghiệp" },
  ];
}

export default function UpdateHistoryRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <UpdateHistory />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
