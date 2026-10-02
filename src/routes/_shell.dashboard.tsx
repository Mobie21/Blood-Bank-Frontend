import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplet, AlertTriangle, ArrowUpRight, Users, ClipboardList, Search } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { BloodDistribution } from "@/components/blood-distribution";
import { useQuery } from "@tanstack/react-query";
import {
  emptyStock,
  getEnquiryStats,
  getExpiring,
  getInventorySummary,
  listNotifications,
  listStaff,
  timeAgo,
} from "@/lib/backend";
import { useTenant } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HaemoCentral" },
      { name: "description", content: "Live blood inventory, expiring units, requests and recent activity for your institution." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useTenant();
  const summaryQ = useQuery({ queryKey: ["inventory", "summary"], queryFn: getInventorySummary });
  const expiringQ = useQuery({ queryKey: ["inventory", "expiring", 3], queryFn: () => getExpiring(3) });
  const enquiryQ = useQuery({ queryKey: ["enquiries", "stats"], queryFn: getEnquiryStats });
  const staffQ = useQuery({ queryKey: ["staff"], queryFn: listStaff });
  const notesQ = useQuery({ queryKey: ["notifications"], queryFn: listNotifications });

  const summary = summaryQ.data;
  const expiring = expiringQ.data ?? [];
  const stats = enquiryQ.data ?? {};
  const activeRequests = (stats.pending ?? 0) + (stats.approved ?? 0);
  const activeStaff = (staffQ.data?.data ?? []).filter((s) => s.status === "active").length;
  const activity = (notesQ.data?.data ?? []).slice(0, 5);
  const loadError = summaryQ.error as Error | null;
  void user;

  return (
    <>
      {loadError && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 ring-1 ring-red-200">
          {loadError.message}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Units" value={summary ? summary.total_units.toLocaleString() : "—"} hint={summary ? `${summary.reserved} reserved` : "Loading"} hintTone="muted" icon={Droplet} />
        <StatCard label="Expiring Soon" value={summary?.expiring_soon ?? "—"} hint="Next 30 days" hintTone={summary?.expiring_soon ? "critical" : "success"} icon={AlertTriangle} />
        <StatCard label="Active Requests" value={activeRequests} hint={`${stats.pending ?? 0} pending`} hintTone="muted" icon={ClipboardList} />
        <StatCard label="Active Staff" value={activeStaff} hint="Active accounts" hintTone="muted" icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 bg-card p-6 rounded-xl ring-1 ring-black/5 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Stock Distribution</h3>
              <p className="text-xs text-muted-foreground mt-1">Live inventory levels by blood group</p>
            </div>
            <Link to="/reports" className="text-xs font-medium text-blood hover:underline">
              Download report
            </Link>
          </div>
          <BloodDistribution stock={summary?.by_group ?? emptyStock()} />
        </div>

        <Link
          to="/search"
          className="lg:col-span-4 bg-sidebar rounded-xl p-6 text-white relative overflow-hidden group"
        >
          <div className="relative z-10 h-full flex flex-col">
            <div className="size-10 rounded-lg bg-white/10 ring-1 ring-white/15 grid place-items-center mb-4">
              <Search className="size-5" />
            </div>
            <h3 className="text-lg font-medium leading-tight">Nationwide Search</h3>
            <p className="text-sm text-white/70 mt-2 max-w-[35ch]">
              Locate and request rare blood types from the unified national grid.
            </p>
            <div className="mt-6 md:mt-auto pt-6 inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all">
              Start new search <ArrowUpRight className="size-4" />
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 size-48 bg-white/5 rounded-full blur-3xl" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 bg-card rounded-xl ring-1 ring-black/5 shadow-card overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Expiring Inventory</h3>
            <span className="text-xs text-muted-foreground">Next 72 hours</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3">Unit ID</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Collection</th>
                  <th className="px-6 py-3">Expiry</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expiring.map((u) => {
                  const hours = Math.max(
                    0,
                    Math.round((new Date(u.expiresOn).getTime() - Date.now()) / 3_600_000),
                  );
                  const tone =
                    hours <= 24
                      ? "bg-red-100 text-red-700"
                      : hours <= 48
                        ? "bg-amber-100 text-amber-700"
                        : "bg-muted text-muted-foreground";
                  const status = hours <= 24 ? "Critical" : hours <= 48 ? "Warning" : "Stable";
                  return (
                    <tr key={u.id} className="text-sm text-foreground/80 hover:bg-muted/40">
                      <td className="px-6 py-3.5 font-medium text-foreground">{u.unitCode}</td>
                      <td className="px-6 py-3.5">{u.bloodGroup}</td>
                      <td className="px-6 py-3.5">{u.collectedOn ? u.collectedOn.slice(0, 10) : "—"}</td>
                      <td className="px-6 py-3.5">{hours}h remaining</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
                            tone,
                          )}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {expiring.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      {expiringQ.isLoading ? "Loading..." : "No units expiring in the next 72 hours."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-card rounded-xl ring-1 ring-black/5 shadow-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-6">Recent Activity</h3>
          <ul className="space-y-5">
            {activity.length === 0 && (
              <li className="text-sm text-muted-foreground">
                {notesQ.isLoading ? "Loading..." : "No recent activity."}
              </li>
            )}
            {activity.map((a) => (
              <li key={a._id} className="flex gap-4">
                <span
                  className={cn(
                    "size-2 mt-1.5 rounded-full shrink-0",
                    a.severity === "critical" && "bg-blood",
                    a.severity === "warning" && "bg-amber-500",
                    a.severity === "info" && "bg-blue-500",
                  )}
                />
                <div>
                  <p className="text-sm text-foreground leading-snug">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(a.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/notifications"
            className="mt-6 block w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground py-2 ring-1 ring-border rounded-md transition"
          >
            View all logs
          </Link>
        </div>
      </div>
    </>
  );
}
