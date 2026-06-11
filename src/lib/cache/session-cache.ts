export type CachedSession = {
  id: string;
  userId: string;
  role: "admin" | "instructor" | "student";
  lastSeen: number;
  expiresAt: number | null;
};

const sessionStore = new Map<string, CachedSession>();

export function putSession(
  id: string,
  userId: string,
  role: CachedSession["role"],
  ttlMs?: number
) {
  const session: CachedSession = {
    id,
    userId,
    role,
    lastSeen: Date.now(),
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
  };

  sessionStore.set(id, session);
  return session;
}

export function getSession(id: string) {
  return sessionStore.get(id) ?? null;
}

export function listSessionDebugSnapshot() {
  return Array.from(sessionStore.values()).map((session) => ({
    id: session.id,
    userId: session.userId,
    role: session.role,
    lastSeen: session.lastSeen,
    expiresAt: session.expiresAt,
  }));
}
