import { createFileRoute } from "@tanstack/react-router";
import { Building2, FlaskConical, Users, Droplet, Activity as ActivityIcon } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useQuery } from "@tanstack/react-query";
import { emptyStock, getAdminOverview, listAuditLogs, listInstitutions, timeAgo } from "@/lib/backend";
import { BloodDistribution } from "@/components/blood-distribution";

export const Route = createFileRoute("/_shell/admin/")({
  head: () => ({
    meta: [
      { title: "System Dashboard — HaemoCentral" },
      { name: "description", content: "Nationwide analytics across every registered hospital and laboratory." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const overviewQ = useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });
  const instQ = useQuery({ queryKey: ["institutions", "all"], queryFn: () => listInstitutions() });
  const logsQ = useQuery({ queryKey: ["admin", "audit"], queryFn: listAuditLogs });
  const o = overviewQ.data;
  const institutions = instQ.data ?? [];
  const nationalStock = { ...emptyStock(), ...(o?.national_stock ?? {}) };
  const logs = logsQ.data ?? [];

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">National Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {overviewQ.error ? (overviewQ.error as Error).message : `Live activity across ${institutions.length} registered institutions.`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Hospitals" value={o?.hospitals ?? "—"} icon={Building2} hint="Registered" hintTone="muted" />
        <StatCard label="Total Laboratories" value={o?.laboratories ?? "—"} icon={FlaskConical} hint="Registered" hintTone="muted" />
        <StatCard label="Total Blood Bags" value={o ? o.total_units.toLocaleString() : "—"} icon={Droplet} hint="Available nationally" hintTone="muted" />
        <StatCard label="System Users" value={o?.users ?? "—"} icon={Users} hint={`${o?.pending_enquiries ?? 0} pending enquiries`} hintTone="muted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 bg-card p-6 rounded-xl ring-1 ring-black/5 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold">National Stock Distribution</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Aggregated across all hospitals and laboratories
              </p>
            </div>
          </div>
          <BloodDistribution stock={nationalStock} criticalThreshold={100} />
        </div>

        <div className="lg:col-span-4 bg-card rounded-xl ring-1 ring-black/5 shadow-card p-6">
          <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <ActivityIcon className="size-4 text-blood" /> System Activity
          </h3>
          <ul className="space-y-5">
            {logs.length === 0 && (
              <li className="text-sm text-muted-foreground">{logsQ.isLoading ? "Loading..." : "No activity yet."}</li>
            )}
            {logs.map((a) => (
              <li key={a._id} className="text-sm">
                <p className="text-foreground leading-snug">
                  {a.actorId?.fullName ?? "System"} · {a.action.replace(/[._]/g, " ")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card overflow-x-auto">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-semibold">Institution Stock Summary</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
              <th className="px-6 py-3">Institution</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3 text-right">Total units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {institutions.map((h) => (
              <tr key={h.id} className="hover:bg-muted/30">
                <td className="px-6 py-3.5 font-medium text-foreground">{h.name}</td>
                <td className="px-6 py-3.5 text-muted-foreground capitalize">{h.type}</td>
                <td className="px-6 py-3.5 text-muted-foreground">
                  {h.city}, {h.province}
                </td>
                <td className="px-6 py-3.5 text-right font-mono">{h.total_units.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
