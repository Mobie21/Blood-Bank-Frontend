import { createFileRoute } from "@tanstack/react-router";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAFF } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/staff")({
  head: () => ({
    meta: [
      { title: "Staff — HaemoCentral" },
      { name: "description", content: "Manage staff accounts, roles and departments for your institution." },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">{STAFF.length} members</p>
        </div>
        <Button className="bg-blood hover:bg-blood-dark text-white">
          <Plus className="size-4" /> Add staff member
        </Button>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Position</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {STAFF.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-blood/10 grid place-items-center text-xs font-semibold text-blood">
                      {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-muted-foreground">{s.department}</td>
                <td className="px-6 py-3.5 text-muted-foreground">{s.position}</td>
                <td className="px-6 py-3.5 text-muted-foreground">{s.phone}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
                      s.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.status}
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
