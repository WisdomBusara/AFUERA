import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export type SessionMember = {
  user: { id: string; email: string | null };
  member: {
    id: string;
    name: string;
    initials: string;
    color: string;
    role: string;
    isSuperAdmin: boolean;
    workspaceId: string;
    workspace: { id: string; name: string; slug: string };
  };
  workspaceId: string;
};

/**
 * Resolves the session cookie to a Member row. Accounts are created by an admin
 * (`npm run db:admin`), not by public sign-up, so there is no provisioning here.
 * Returns null when there is no valid session or the member can no longer sign in.
 */
export async function getSessionMember(): Promise<SessionMember | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const memberId = await verifySession(token);
  if (!memberId) return null;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { workspace: true },
  });
  // A member without a password is a roster-only profile and cannot hold a session.
  if (!member || !member.passwordHash) return null;

  return {
    user: { id: member.id, email: member.email },
    member: {
      id: member.id,
      name: member.name,
      initials: member.initials,
      color: member.color,
      role: member.role,
      isSuperAdmin: member.isSuperAdmin,
      workspaceId: member.workspaceId,
      workspace: { id: member.workspace.id, name: member.workspace.name, slug: member.workspace.slug },
    },
    workspaceId: member.workspaceId,
  };
}

/** Same as getSessionMember but redirects to /login when unauthenticated. */
export async function requireMember(): Promise<SessionMember> {
  const s = await getSessionMember();
  if (!s) redirect("/login");
  return s;
}
