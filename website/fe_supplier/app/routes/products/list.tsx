import type { Route } from "./+types/list";
import ProductList from "~/pages/products/ProductList";
import DashboardLayout from "~/component/DashboardLayout";
import ProtectedRoute from "~/component/ProtectedRoute";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Danh sách sản phẩm - SaveFood" },
    { name: "description", content: "Quản lý sản phẩm của cửa hàng" },
  ];
}

export default function ProductListRoute() {
  return (
    <ProtectedRoute requireRoles={['SUPPLIER']}>
      <DashboardLayout>
        <ProductList />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
