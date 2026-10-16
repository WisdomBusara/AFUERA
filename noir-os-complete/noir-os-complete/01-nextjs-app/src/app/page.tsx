import { redirect } from "next/navigation";

// Noir OS opens on your Daily Brief.
export default function Home() {
  redirect("/brief");
}
