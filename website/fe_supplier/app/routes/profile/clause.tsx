import type { MetaFunction } from "react-router";
import Clause from "~/component/common/Clause";

export const meta: MetaFunction = () => {
  return [
    { title: "Điều khoản sử dụng - SaveFood Supplier" },
    { name: "description", content: "Điều khoản sử dụng dành cho nhà cung cấp trên nền tảng SaveFood" },
  ];
};

export default Clause;
