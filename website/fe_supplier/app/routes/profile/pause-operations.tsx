import PauseOperations from "~/pages/profile/PauseOperations";
import DashboardLayout from "~/component/layout/DashboardLayout";

export function meta() {
  return [
    { title: "Quản lý hoạt động - Supplier" },
    { name: "description", content: "Tạm dừng hoặc tiếp tục hoạt động kinh doanh" },
  ];
}

export default function PauseOperationsRoute() {
  return (
    <DashboardLayout>
      <PauseOperations />
    </DashboardLayout>
  );
}
