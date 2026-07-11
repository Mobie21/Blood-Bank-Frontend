import { createFileRoute } from "@tanstack/react-router";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const USERS = [
  { id: "u1", name: "Amara Okonkwo", email: "amara@haemocentral.gov", role: "Super Admin", tenant: "National Health Authority", status: "active" },
  { id: "u2", name: "Dr. Aris Thorne", email: "aris@stjude.med", role: "Hospital Admin", tenant: "St. Jude Medical Center", status: "active" },
  { id: "u3", name: "Dr. Linda Kariuki", email: "linda@metrogen.med", role: "Hospital Admin", tenant: "Metropolitan General", status: "active" },
  { id: "u4", name: "Aisha Bakari", email: "aisha@meridian.lab", role: "Lab Admin", tenant: "Meridian Diagnostics", status: "active" },
  { id: "u5", name: "Peter Njoroge", email: "peter@pathway.lab", role: "Lab Admin", tenant: "Pathway Reference Lab", status: "inactive" },
];

export const Route = createFileRoute("/_shell/admin/users")({
  head: () => ({
    meta: [
      { title: "System Users — HaemoCentral" },
      { name: "description", content: "Manage super admins, hospital admins and laboratory admins." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{USERS.length} accounts</p>
        </div>
        <Button className="bg-blood hover:bg-blood-dark text-white">
          <Plus className="size-4" /> Add user
        </Button>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Institution</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {USERS.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-blood/10 grid place-items-center text-xs font-semibold text-blood">
                      {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blood/10 text-blood">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-muted-foreground">{u.tenant}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
                      u.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {u.status}
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
