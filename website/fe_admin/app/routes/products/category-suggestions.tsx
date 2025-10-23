import type { Route } from './+types/category-suggestions';
import CategorySuggestions from "~/pages/products/CategorySuggestions";
import ProtectedRoute from "~/component/common/ProtectedRoute";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Đề xuất danh mục - SaveFood" },
    { name: "description", content: "Quản lý đề xuất danh mục sản phẩm" },
  ];
}

export default function CategorySuggestionsPage() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <CategorySuggestions />
    </ProtectedRoute>
  );
}
