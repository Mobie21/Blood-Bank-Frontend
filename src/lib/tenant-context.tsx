import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getTokens, setTokens } from "./api";

export type Role = "super_admin" | "hospital_admin" | "staff";

export interface Tenant {
  id: string;
  name: string;
  type: "hospital" | "laboratory";
  city: string;
  province: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenant: Tenant;
}

const NATIONAL_TENANT: Tenant = {
  id: "gov",
  name: "National Blood Service Zimbabwe",
  type: "hospital",
  city: "Harare",
  province: "—",
};

const EMPTY_USER: CurrentUser = {
  id: "",
  name: "Guest",
  email: "",
  role: "staff",
  tenant: NATIONAL_TENANT,
};

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenant: Tenant | null;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: ApiUser;
}

function toCurrentUser(u: ApiUser): CurrentUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role, tenant: u.tenant ?? NATIONAL_TENANT };
}

interface TenantContextValue {
  user: CurrentUser;
  signIn: (email: string, password: string) => Promise<CurrentUser>;
  signOut: () => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

const USER_KEY = "haemocentral.user";
const ROLE_KEY = "haemocentral.role";
const AUTH_KEY = "haemocentral.auth";

function persist(user: CurrentUser | null) {
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(ROLE_KEY, user.role);
    sessionStorage.setItem(AUTH_KEY, "1");
  } else {
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(EMPTY_USER);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      if (raw && getTokens()) setUser(JSON.parse(raw) as CurrentUser);
      else persist(null);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<TenantContextValue>(
    () => ({
      user,
      signIn: async (email, password) => {
        const data = await api<LoginResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
        const u = toCurrentUser(data.user);
        persist(u);
        setUser(u);
        return u;
      },
      signOut: () => {
        const t = getTokens();
        if (t) {
          api("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refresh_token: t.refresh_token }),
          }).catch(() => {});
        }
        setTokens(null);
        persist(null);
        setUser(EMPTY_USER);
      },
    }),
    [user],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
