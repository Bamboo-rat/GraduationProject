import type { MetaFunction } from "react-router";
import ForgotPassword from "~/pages/profile/ForgotPassword";

export const meta: MetaFunction = () => {
  return [
    { title: "Quên mật khẩu - SaveFood Supplier" },
    { name: "description", content: "Yêu cầu đặt lại mật khẩu cho tài khoản Supplier" },
  ];
};

export default ForgotPassword;
