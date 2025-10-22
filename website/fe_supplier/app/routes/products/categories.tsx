import type { Route } from "./+types/categories";
import CategorySuggestionList from "~/pages/products/CategorySuggestionList";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Đề xuất danh mục - SaveFood" },
    { name: "description", content: "Đề xuất danh mục sản phẩm mới" },
  ];
}

export default function CategorySuggestionsRoute() {
  return <CategorySuggestionList />;
}
