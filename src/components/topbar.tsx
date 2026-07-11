import { Bell, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useTenant, type Role } from "@/lib/tenant-context";

export function TopBar({ title, badge }: { title?: string; badge?: string }) {
  const { user, setRole } = useTenant();
  const displayTitle = title ?? user.tenant.name;
  const displayBadge =
    badge ??
    (user.role === "super_admin"
      ? "System Console"
      : user.tenant.type === "laboratory"
        ? "Laboratory"
        : "Regional Hub");

  return (
    <header className="h-16 bg-card ring-1 ring-black/5 flex items-center justify-between px-6 md:px-8 shrink-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base md:text-lg font-medium text-foreground truncate">
          {displayTitle}
        </h1>
        <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground uppercase tracking-wider">
          {displayBadge}
        </span>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-muted/60 border-none ring-1 ring-border rounded-md py-1.5 pl-9 pr-4 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blood/30 transition"
          />
        </div>

        <select
          value={user.role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="text-xs bg-muted/60 border border-border rounded-md px-2 py-1.5 focus:outline-none"
          aria-label="Demo role switcher"
          title="Demo — switch role"
        >
          <option value="hospital_admin">Hospital Admin</option>
          <option value="lab_admin">Lab Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        <Link
          to="/notifications"
          className="relative text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute top-0 right-0 size-1.5 bg-blood rounded-full ring-2 ring-card" />
        </Link>

        <Link to="/profile" className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-blood/10 ring-1 ring-blood/20 grid place-items-center text-xs font-semibold text-blood">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
        </Link>
      </div>
    </header>
  );
}
