import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Droplet,
  Search,
  Users,
  FileBarChart,
  Bell,
  Settings,
  Building2,
  FlaskConical,
  UserCog,
  LogOut,
  Activity,
  Inbox,
} from "lucide-react";
import { useTenant } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";

const HOSPITAL_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Blood Inventory", icon: Droplet },
  { to: "/search", label: "Blood Search", icon: Search },
  { to: "/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const SUPER_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { to: "/admin/laboratories", label: "Laboratories", icon: FlaskConical },
  { to: "/admin/users", label: "System Users", icon: UserCog },
  { to: "/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const STAFF_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Blood Inventory", icon: Droplet },
  { to: "/search", label: "Blood Search", icon: Search },
  { to: "/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { user, signOut } = useTenant();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav =
    user.role === "super_admin" ? SUPER_NAV : user.role === "staff" ? STAFF_NAV : HOSPITAL_NAV;

  return (
    <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="size-9 rounded-lg bg-white/10 ring-1 ring-white/20 grid place-items-center">
          <Activity className="size-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold tracking-tight leading-tight">HaemoCentral</div>
          <div className="text-[10px] uppercase tracking-widest text-white/50">
            {user.role === "super_admin" ? "System Console" : "Hospital Portal"}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {nav.map((item) => {
          const active =
            pathname === item.to ||
            (item.to !== "/admin" && pathname.startsWith(item.to + "/")) ||
            (item.to === "/admin" && pathname === "/admin");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-9 rounded-full bg-white/10 ring-1 ring-white/15 grid place-items-center text-xs font-semibold">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] text-white/50 truncate">{user.tenant.name}</p>
          </div>
          <Link
            to="/login"
            onClick={() => signOut()}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
