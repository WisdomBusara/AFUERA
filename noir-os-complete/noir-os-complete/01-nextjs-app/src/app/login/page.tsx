import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

// Already signed in → straight to the brief. (Done here rather than in middleware so a
// stale cookie for a removed member can't bounce between /login and the app.)
export default async function LoginPage() {
  if (await getSessionMember()) redirect("/brief");
  return <LoginForm />;
}
