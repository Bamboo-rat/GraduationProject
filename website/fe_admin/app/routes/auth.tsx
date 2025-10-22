import type { Route } from "./+types/auth";
import Auth from "~/pages/Auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SaveFood - Admin Login" },
    { name: "description", content: "Login to SaveFood admin portal" },
  ];
}

export default function AuthRoute() {
  return <Auth />;
}
