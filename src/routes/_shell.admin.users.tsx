import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SysRole = "Super Admin" | "Hospital Admin" | "Lab Admin";
type Status = "active" | "inactive";

interface SysUser {
  id: string;
  name: string;
  email: string;
  role: SysRole;
  tenant: string;
  status: Status;
}

const INITIAL: SysUser[] = [
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
  const [users, setUsers] = useState<SysUser[]>(INITIAL);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SysUser | null>(null);
  const [deleting, setDeleting] = useState<SysUser | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (u: SysUser) => {
    setEditing(u);
    setDialogOpen(true);
  };
  const toggleStatus = (u: SysUser) => {
    setUsers((prev) =>
      prev.map((x) =>
        x.id === u.id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x,
      ),
    );
    toast.success(`${u.name} ${u.status === "active" ? "deactivated" : "activated"}`);
  };
  const confirmDelete = () => {
    if (!deleting) return;
    setUsers((prev) => prev.filter((x) => x.id !== deleting.id));
    toast.success(`${deleting.name} removed`);
    setDeleting(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} accounts</p>
        </div>
        <Button className="bg-blood hover:bg-blood-dark text-white" onClick={openAdd}>
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
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No users yet.
                </td>
              </tr>
            )}
            {users.map((u) => (
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Actions"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(u)}>
                        <Pencil className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(u)}>
                        <Power className="size-4" />
                        {u.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleting(u)}
                      >
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(u) => {
          if (editing) {
            setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
            toast.success(`${u.name} updated`);
          } else {
            setUsers((prev) => [u, ...prev]);
            toast.success(`${u.name} added`);
          }
          setDialogOpen(false);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this account from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blood hover:bg-blood-dark text-white"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function UserDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: SysUser | null;
  onSubmit: (u: SysUser) => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    role: editing?.role ?? ("Hospital Admin" as SysRole),
    tenant: editing?.tenant ?? "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: editing?.id ?? `u_${Date.now()}`,
      status: editing?.status ?? "active",
      ...form,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this system user's details."
              : "Provision an admin account for a hospital, laboratory, or the national authority."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs">Full name</Label>
            <Input
              className="mt-1.5"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input
              className="mt-1.5"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs">Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v as SysRole }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
                <SelectItem value="Hospital Admin">Hospital Admin</SelectItem>
                <SelectItem value="Lab Admin">Lab Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Institution</Label>
            <Input
              className="mt-1.5"
              required
              placeholder="e.g. St. Jude Medical Center"
              value={form.tenant}
              onChange={(e) => setForm((f) => ({ ...f, tenant: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blood hover:bg-blood-dark text-white">
              {editing ? "Save changes" : "Add user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
