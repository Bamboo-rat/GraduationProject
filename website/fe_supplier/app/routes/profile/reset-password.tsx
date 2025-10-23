import type { MetaFunction } from "react-router";
import ResetPassword from "~/pages/profile/ResetPassword";

export const meta: MetaFunction = () => {
  return [
    { title: "Đặt lại mật khẩu - SaveFood Supplier" },
    { name: "description", content: "Đặt lại mật khẩu mới cho tài khoản Supplier" },
  ];
};

export default ResetPassword;
