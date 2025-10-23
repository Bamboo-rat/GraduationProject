import type { Route } from './+types/review';
import ProductReview from "~/pages/products/ProductReview";
import ProtectedRoute from "~/component/common/ProtectedRoute";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sản phẩm cần duyệt - SaveFood" },
    { name: "description", content: "Quản lý duyệt sản phẩm" },
  ];
}

export default function ProductReviewPage() {
  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'MODERATOR', 'STAFF']}>
      <ProductReview />
    </ProtectedRoute>
  );
}
