import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTenant } from "@/lib/tenant-context";
import {
  getDistribution,
  getExpiring,
  listInstitutions,
  listInventory,
  listStaff,
  searchBlood,
} from "@/lib/backend";
import { BLOOD_GROUPS } from "@/lib/mock-data";

type Row = Record<string, string | number>;

interface Report {
  title: string;
  desc: string;
  superOnly?: boolean;
  tenantOnly?: boolean;
  build: () => Promise<Row[]>;
}

const REPORTS: Report[] = [
  {
    title: "Blood Stock",
    desc: "Every blood unit currently held by your institution.",
    tenantOnly: true,
    build: async () =>
      (await listInventory({})).data.map((u) => ({
        unit_code: u.unitCode,
        group: u.bloodGroup,
        status: u.status,
        donor: u.donorNumber ?? "",
        storage: u.storageLocation ?? "",
        collected: u.collectedOn?.slice(0, 10) ?? "",
        expires: u.expiresOn.slice(0, 10),
      })),
  },
  {
    title: "Blood by Group",
    desc: "Available units per blood group.",
    build: async () => (await getDistribution()).map((d) => ({ group: d.group, units: d.units })),
  },
  {
    title: "Blood Expiry",
    desc: "Units expiring in the next 30 days.",
    tenantOnly: true,
    build: async () =>
      (await getExpiring(30)).map((u) => ({
        unit_code: u.unitCode,
        group: u.bloodGroup,
        expires: u.expiresOn.slice(0, 10),
        days_left: u.days_to_expiry,
      })),
  },
  {
    title: "Institution Summary",
    desc: "Registered institutions with status, contact and stock.",
    superOnly: true,
    build: async () =>
      (await listInstitutions()).map((i) => ({
        name: i.name,
        code: i.code,
        type: i.type,
        city: i.city,
        province: i.province,
        phone: i.phone ?? "",
        status: i.status,
        total_units: i.total_units,
        staff: i.staff_count,
      })),
  },
  {
    title: "Staff Summary",
    desc: "Staff accounts, roles and departments.",
    tenantOnly: true,
    build: async () =>
      (await listStaff()).data.map((s) => ({
        name: s.fullName,
        email: s.email,
        role: s.role,
        department: s.department ?? "",
        position: s.designation ?? "",
        status: s.status,
      })),
  },
  {
    title: "Blood Availability",
    desc: "Nationwide availability by institution and group.",
    build: async () => {
      const all = await Promise.all(BLOOD_GROUPS.map((g) => searchBlood({ group: g, min_quantity: 1 })));
      return all.flatMap((r) =>
        r.data.map((x) => ({
          institution: x.institution.name,
          province: x.institution.province,
          group: x.group,
          available: x.available,
        })),
      );
    },
  },
];

function toCsv(rows: Row[]) {
  const cols = Object.keys(rows[0]);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c] ?? "")).join(","))].join("\n");
}

export const Route = createFileRoute("/_shell/reports")({
  head: () => ({
    meta: [
      { title: "Reports — HaemoCentral" },
      { name: "description", content: "Generate and export operational reports on stock, staff and availability." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = useTenant();
  const isSuper = user.role === "super_admin";
  const [busy, setBusy] = useState<string | null>(null);
  const reports = REPORTS.filter((r) => (isSuper ? !r.tenantOnly : !r.superOnly));

  const download = async (r: Report) => {
    setBusy(r.title);
    try {
      const rows = await r.build();
      if (rows.length === 0) {
        toast.info(`${r.title}: no data to export yet`);
        return;
      }
      const blob = new Blob([toCsv(rows)], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${r.title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`${r.title} downloaded (${rows.length} rows)`);
    } catch (e) {
      toast.error("Export failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Download live reports as spreadsheet (CSV) files.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {reports.map((r) => (
          <div key={r.title} className="bg-card rounded-xl ring-1 ring-black/5 shadow-card p-5 flex flex-col">
            <div className="size-10 rounded-lg bg-blood/10 grid place-items-center text-blood mb-4">
              <FileText className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground">{r.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 flex-1">{r.desc}</p>
            <div className="mt-5">
              <Button variant="outline" size="sm" disabled={busy === r.title} onClick={() => download(r)}>
                <Download className="size-3.5" /> {busy === r.title ? "Preparing..." : "Download CSV"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
