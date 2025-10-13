import type { Route } from "./+types/welcome";
import Welcome from "~/pages/Welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Welcome to the FoodSave" },
    { name: "description", content: "Welcome to the FoodSave!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
