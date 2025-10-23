import type { Route } from "./+types/forgot-password";
import ForgotPassword from "~/pages/profile/ForgotPassword";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quên mật khẩu - SaveFood Admin" },
    { name: "description", content: "Reset your admin account password" },
  ];
}

export default function ForgotPasswordRoute() {
  return <ForgotPassword />;
}
