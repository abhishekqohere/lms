import type { UserRole } from "@/types";
import type { Session } from "next-auth";

export function hasRole(session: Session | null, roles: UserRole[]): boolean {
  if (!session?.user?.role) return false;
  return roles.includes(session.user.role as UserRole);
}

export function requireAuth(session: Session | null): asserts session is Session {
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
}

export function requireRole(session: Session | null, roles: UserRole[]): void {
  requireAuth(session);
  if (!hasRole(session, roles)) {
    throw new Error("Forbidden");
  }
}
