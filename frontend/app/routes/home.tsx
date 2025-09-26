import type { Route } from "./+types/home";
import Welcome from "~/pages/Welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "KienlongBank" },
    { name: "description", content: "Welcome to KienlongBank!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
