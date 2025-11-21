import type { MetaFunction } from "react-router";
import Policy from "~/component/common/Policy";

export const meta: MetaFunction = () => {
  return [
    { title: "Chính sách bảo mật - SaveFood Supplier" },
    { name: "description", content: "Chính sách bảo mật dành cho nhà cung cấp trên nền tảng SaveFood" },
  ];
};

export default Policy;
