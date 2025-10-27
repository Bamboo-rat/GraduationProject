import type { Route } from "./+types/create";
import CreateProduct from "~/pages/products/CreateProduct";
import DashboardLayout from "~/component/layout/DashboardLayout";
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tạo sản phẩm mới - SaveFood" },
    { name: "description", content: "Thêm sản phẩm mới vào cửa hàng" },
  ];
}

export default function CreateProductRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <CreateProduct />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
