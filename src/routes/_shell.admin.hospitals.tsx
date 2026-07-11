import { createFileRoute } from "@tanstack/react-router";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOSPITALS, totalStock } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/admin/hospitals")({
  head: () => ({
    meta: [
      { title: "Hospitals — HaemoCentral" },
      { name: "description", content: "Manage registered hospitals across the national network." },
    ],
  }),
  component: HospitalsPage,
});

function HospitalsPage() {
  const hospitals = HOSPITALS.filter((h) => h.type === "hospital");
  return <InstitutionTable title="Hospitals" items={hospitals} />;
}

export function InstitutionTable({ title, items }: { title: string; items: typeof HOSPITALS }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} registered</p>
        </div>
        <Button className="bg-blood hover:bg-blood-dark text-white">
          <Plus className="size-4" /> Add {title.slice(0, -1).toLowerCase()}
        </Button>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((h) => (
              <tr key={h.id} className="hover:bg-muted/30">
                <td className="px-6 py-3.5">
                  <div className="font-medium text-foreground">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.bloodDeptContact}</div>
                </td>
                <td className="px-6 py-3.5 text-muted-foreground font-mono">{h.code}</td>
                <td className="px-6 py-3.5 text-muted-foreground">
                  {h.city}, {h.province}
                </td>
                <td className="px-6 py-3.5 text-muted-foreground">
                  <div>{h.phone}</div>
                  <div className="text-xs">{h.email}</div>
                </td>
                <td className="px-6 py-3.5 font-mono">{totalStock(h.stock).toLocaleString()}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
                      h.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {h.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
