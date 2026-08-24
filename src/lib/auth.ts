/**
 * LOCAL-ONLY auth layer.
 *
 * There is deliberately no database or auth provider here — the identity is
 * kept in localStorage so every screen can be reviewed end to end. Swap these
 * four functions for real API calls (Django, etc.) later.
 */
import { useEffect, useState } from "react";

export type AccountRole = "customer" | "staff" | "rider";

export type AuthAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AccountRole;
  createdAt: string;
};

const KEY = "kmg.auth.v1";
const EVENT = "kmg-auth-change";

export const ROLE_HOME: Record<AccountRole, string> = {
  customer: "/profile",
  staff: "/admin",
  rider: "/rider/profile",
};

export const ROLE_COPY: Record<
  AccountRole,
  { label: string; tagline: string; destination: string }
> = {
  customer: {
    label: "Customer",
    tagline: "Order, track your rider live and keep your favourites",
    destination: "My profile",
  },
  staff: {
    label: "Staff / Owner",
    tagline: "Owner console: orders, payments, riders and revenue graphs",
    destination: "Owner console",
  },
  rider: {
    label: "Rider",
    tagline: "Build your partner profile, take jobs and share live location",
    destination: "Rider console",
  },
};

export function readAccount(): AuthAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthAccount) : null;
  } catch {
    return null;
  }
}

function publish(next: AuthAccount | null) {
  if (typeof window === "undefined") return;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function signUpLocal(input: {
  name: string;
  email: string;
  phone: string;
  role: AccountRole;
}): AuthAccount {
  const account: AuthAccount = {
    id: `acc-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    role: input.role,
    createdAt: new Date().toISOString(),
  };
  publish(account);
  return account;
}

export function signInLocal(email: string, role?: AccountRole): AuthAccount {
  const existing = readAccount();
  const normalized = email.trim().toLowerCase();
  const base: AuthAccount =
    existing && existing.email === normalized
      ? existing
      : {
          id: existing?.id ?? `acc-${Date.now()}`,
          name: existing?.name ?? normalized.split("@")[0] ?? "Guest",
          email: normalized,
          phone: existing?.phone ?? "",
          role: existing?.role ?? "customer",
          createdAt: existing?.createdAt ?? new Date().toISOString(),
        };
  const account: AuthAccount = { ...base, role: role ?? base.role };
  publish(account);
  return account;
}

export function signOutLocal() {
  publish(null);
}

export function useAccount() {
  const [account, setAccount] = useState<AuthAccount | null | undefined>(undefined);

  useEffect(() => {
    const sync = () => setAccount(readAccount());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { account: account ?? null, isLoading: account === undefined };
}
