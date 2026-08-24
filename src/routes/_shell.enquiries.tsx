import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Inbox, Send, Search, Droplet, ShoppingCart } from "lucide-react";
import { useTenant } from "@/lib/tenant-context";
import {
  loadEnquiries,
  saveEnquiries,
  formatDate,
  type Enquiry,
  type EnquiryStatus,
} from "@/lib/enquiries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/enquiries")({
  head: () => ({
    meta: [
      { title: "Blood Enquiries — HaemoCentral" },
      {
        name: "description",
        content:
          "Review blood enquiries and orders your institution has received and sent across the national network.",
      },
      { property: "og:title", content: "Blood Enquiries — HaemoCentral" },
      {
        property: "og:description",
        content: "Track incoming and outgoing blood enquiries and orders for your institution.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EnquiriesPage,
});

const STATUS_STYLES: Record<EnquiryStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  declined: "bg-red-100 text-red-700",
  fulfilled: "bg-emerald-100 text-emerald-700",
};

type Tab = "received" | "sent";

function EnquiriesPage() {
  const { user } = useTenant();
  const [all, setAll] = useState<Enquiry[]>([]);
  const [tab, setTab] = useState<Tab>("received");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setAll(loadEnquiries());
  }, []);

  const tenantId = user.tenant.id;
  const isSuper = user.role === "super_admin";

  const received = useMemo(
    () => (isSuper ? all : all.filter((e) => e.supplierId === tenantId)),
    [all, tenantId, isSuper],
  );
  const sent = useMemo(
    () => (isSuper ? all : all.filter((e) => e.requesterTenantId === tenantId)),
    [all, tenantId, isSuper],
  );

  const rows = useMemo(() => {
    const list = tab === "received" ? received : sent;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? list.filter((e) =>
          [e.reference, e.group, e.supplierName, e.requesterTenantName, e.requesterName, e.status]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : list;
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [tab, received, sent, query]);

  const update = (id: string, status: EnquiryStatus) => {
    setAll((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, status } : e));
      saveEnquiries(next);
      return next;
    });
    toast.success(`Request ${status}`);
  };

  const pendingCount = received.filter((e) => e.status === "pending").length;
  const orderCount = received.filter((e) => e.kind === "order").length;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isSuper
            ? "All blood enquiries and orders across the national network."
            : `Blood enquiries and orders involving ${user.tenant.name}.`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Received" value={received.length} icon={Inbox} hint="All time" hintTone="muted" />
        <StatCard
          label="Awaiting response"
          value={pendingCount}
          icon={Droplet}
          hint={pendingCount ? "Action needed" : "Clear"}
          hintTone={pendingCount ? "critical" : "success"}
        />
        <StatCard label="Orders received" value={orderCount} icon={ShoppingCart} hint="Units requested" hintTone="muted" />
        <StatCard label="Sent by us" value={sent.length} icon={Send} hint="Outgoing" hintTone="muted" />
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="inline-flex p-1 bg-muted rounded-lg">
            {(["received", "sent"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                  tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reference, group, institution…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">{tab === "received" ? "From" : "To"}</th>
                <th className="px-6 py-3">Group</th>
                <th className="px-6 py-3 text-right">Units</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                {tab === "received" && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30 align-top">
                  <td className="px-6 py-3.5 font-mono text-xs text-foreground">{e.reference}</td>
                  <td className="px-6 py-3.5 capitalize text-muted-foreground">{e.kind}</td>
                  <td className="px-6 py-3.5">
                    <div className="font-medium text-foreground">
                      {tab === "received" ? e.requesterTenantName : e.supplierName}
                    </div>
                    {tab === "received" && (
                      <div className="text-xs text-muted-foreground">{e.requesterName}</div>
                    )}
                    {e.notes && <div className="text-xs text-muted-foreground mt-1 max-w-xs">{e.notes}</div>}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-blood">{e.group}</td>
                  <td className="px-6 py-3.5 text-right font-mono">{e.quantity || "—"}</td>
                  <td className="px-6 py-3.5 text-muted-foreground whitespace-nowrap">{formatDate(e.createdAt)}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wider ${STATUS_STYLES[e.status]}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  {tab === "received" && (
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      {e.status === "pending" ? (
                        <div className="inline-flex gap-2">
                          <Button size="sm" className="bg-blood hover:bg-blood-dark text-white" onClick={() => update(e.id, "approved")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => update(e.id, "declined")}>
                            Decline
                          </Button>
                        </div>
                      ) : e.status === "approved" ? (
                        <Button size="sm" variant="outline" onClick={() => update(e.id, "fulfilled")}>
                          Mark fulfilled
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No action</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-sm text-muted-foreground">
                    No {tab} enquiries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
