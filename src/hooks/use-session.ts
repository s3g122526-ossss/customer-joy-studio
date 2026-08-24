import { useEffect, useState } from "react";

/**
 * LOCAL-ONLY session. No auth provider / database is wired up — a lightweight
 * guest identity is kept in localStorage so the storefront and profile screens
 * work end to end. Swap for real auth later.
 */
export type LocalUser = { id: string; email: string; created_at: string };

const KEY = "kmg.guest.v1";

export function getLocalUser(): LocalUser {
  const fallback: LocalUser = {
    id: "guest-local",
    email: "guest@moongrill.pk",
    created_at: new Date().toISOString(),
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LocalUser;
    localStorage.setItem(KEY, JSON.stringify(fallback));
  } catch {
    /* ignore */
  }
  return fallback;
}

export function useSession() {
  const [user, setUser] = useState<LocalUser | null | undefined>(undefined);

  useEffect(() => {
    setUser(getLocalUser());
  }, []);

  return { user, isSignedIn: !!user, isLoading: user === undefined };
}
