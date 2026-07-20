import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "super_admin" | "hospital_admin" | "lab_admin";

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

const DEFAULT_USER: CurrentUser = {
  id: "u_001",
  name: "Dr. Aris Thorne",
  email: "aris.thorne@stjude.med",
  role: "hospital_admin",
  tenant: {
    id: "h_001",
    name: "St. Jude Medical Center",
    type: "hospital",
    city: "Nairobi",
    province: "Nairobi County",
  },
};

const SUPER_ADMIN: CurrentUser = {
  id: "u_super",
  name: "Amara Okonkwo",
  email: "amara@haemocentral.gov",
  role: "super_admin",
  tenant: {
    id: "gov",
    name: "National Health Authority",
    type: "hospital",
    city: "Nairobi",
    province: "—",
  },
};

interface TenantContextValue {
  user: CurrentUser;
  setRole: (role: Role) => void;
  signOut: () => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

const STORAGE_KEY = "haemocentral.role";

export function TenantProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(DEFAULT_USER);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (stored === "super_admin") setUser(SUPER_ADMIN);
      else if (stored === "lab_admin")
        setUser({
          ...DEFAULT_USER,
          role: "lab_admin",
          tenant: {
            id: "l_001",
            name: "Meridian Diagnostics Lab",
            type: "laboratory",
            city: "Mombasa",
            province: "Coast",
          },
        });
      else setUser(DEFAULT_USER);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<TenantContextValue>(
    () => ({
      user,
      setRole: (role) => {
        try {
          localStorage.setItem(STORAGE_KEY, role);
        } catch {
          /* ignore */
        }
        if (role === "super_admin") setUser(SUPER_ADMIN);
        else if (role === "lab_admin")
          setUser({
            ...DEFAULT_USER,
            role: "lab_admin",
            tenant: {
              id: "l_001",
              name: "Meridian Diagnostics Lab",
              type: "laboratory",
              city: "Mombasa",
              province: "Coast",
            },
          });
        else setUser(DEFAULT_USER);
      },
      signOut: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem("haemocentral.auth");
        } catch {
          /* ignore */
        }
        setUser(DEFAULT_USER);
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
