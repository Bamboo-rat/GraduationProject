import type { Route } from "./+types/categories";
import CategorySuggestionList from "~/pages/products/CategorySuggestionList";
import DashboardLayout from "~/component/layout/DashboardLayout";
import ProtectedRoute from '~/component/common/ProtectedRoute';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Đề xuất danh mục - SaveFood" },
    { name: "description", content: "Đề xuất danh mục sản phẩm mới" },
  ];
}

export default function CategorySuggestionsRoute() {
  return (
    <ProtectedRoute requiredRoles={['SUPPLIER']}>
      <DashboardLayout>
        <CategorySuggestionList />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
