import type { Route } from "./+types/update-request";
import StoreUpdateRequest from "~/pages/store/StoreUpdateRequest";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Yêu cầu cập nhật cửa hàng - SaveFood" },
    { name: "description", content: "Gửi yêu cầu cập nhật thông tin cửa hàng" },
  ];
}

export default function StoreUpdateRequestRoute() {
  return <StoreUpdateRequest />;
}
