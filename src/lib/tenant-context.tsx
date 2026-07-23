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
  name: "Dr. Tendai Chikomo",
  email: "tendai.chikomo@parirenyatwa.co.zw",
  role: "hospital_admin",
  tenant: {
    id: "h_001",
    name: "Parirenyatwa Group of Hospitals",
    type: "hospital",
    city: "Harare",
    province: "Harare",
  },
};

const SUPER_ADMIN: CurrentUser = {
  id: "u_super",
  name: "Amara Nyathi",
  email: "amara@haemocentral.gov.zw",
  role: "super_admin",
  tenant: {
    id: "gov",
    name: "National Blood Service Zimbabwe",
    type: "hospital",
    city: "Harare",
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
            name: "Lancet Clinical Laboratories",
            type: "laboratory",
            city: "Harare",
            province: "Harare",
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
          localStorage.setItem("haemocentral.auth", "1");
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
              name: "Lancet Clinical Laboratories",
              type: "laboratory",
              city: "Harare",
              province: "Harare",
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
