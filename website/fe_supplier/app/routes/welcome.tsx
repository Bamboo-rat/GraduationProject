import type { Route } from "./+types/welcome";
import Welcome from "~/pages/Welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Welcome to the SaveFood" },
    { name: "description", content: "Welcome to the SaveFood!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
