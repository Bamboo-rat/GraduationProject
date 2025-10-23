import type { Route } from "./+types/reset-password";
import ResetPassword from "~/pages/profile/ResetPassword";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Đặt lại mật khẩu - SaveFood Admin" },
    { name: "description", content: "Set new password for your admin account" },
  ];
}

export default function ResetPasswordRoute() {
  return <ResetPassword />;
}
