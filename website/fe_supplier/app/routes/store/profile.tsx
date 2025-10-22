import type { Route } from "./+types/profile";
import StoreProfile from "~/pages/store/StoreProfile";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Thông tin cửa hàng - SaveFood" },
    { name: "description", content: "Xem thông tin cửa hàng" },
  ];
}

export default function StoreProfileRoute() {
  return <StoreProfile />;
}
