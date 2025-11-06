import type { Route } from "./+types/business-updates";
import BusinessUpdateRequests from "~/pages/partners/BusinessUpdateRequests";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Yêu cầu cập nhật doanh nghiệp - SaveFood Admin" },
    { name: "description", content: "Quản lý yêu cầu cập nhật thông tin doanh nghiệp" },
  ];
}

export default function BusinessUpdateRequestsRoute() {
  return (
    <>
      <BusinessUpdateRequests />
    </>
  );
}
