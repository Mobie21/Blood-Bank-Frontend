import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, MoreHorizontal, Pencil, Power, Trash2, Search } from "lucide-react";
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
import { HOSPITALS } from "@/lib/mock-data";

type SysRole = "Super Admin" | "Hospital Admin" | "Staff Member";
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
  { id: "u1", name: "Amara Nyathi", email: "amara@haemocentral.gov.zw", role: "Super Admin", tenant: "National Blood Service Zimbabwe", status: "active" },
  { id: "u2", name: "Dr. Tendai Chikomo", email: "tendai.chikomo@parirenyatwa.co.zw", role: "Hospital Admin", tenant: "Parirenyatwa Group of Hospitals", status: "active" },
  { id: "u3", name: "Dr. Rutendo Moyo", email: "rutendo@smch.co.zw", role: "Hospital Admin", tenant: "Sally Mugabe Central Hospital", status: "active" },
  { id: "u4", name: "Rudo Mutasa", email: "rudo.mutasa@parirenyatwa.co.zw", role: "Staff Member", tenant: "Parirenyatwa Group of Hospitals", status: "active" },
  { id: "u5", name: "Tawanda Sibanda", email: "tawanda@mpilo.co.zw", role: "Staff Member", tenant: "Mpilo Central Hospital", status: "inactive" },
];

const STORE_KEY = "haemocentral.sys_users";

export const Route = createFileRoute("/_shell/admin/users")({
  head: () => ({
    meta: [
      { title: "System Users — HaemoCentral" },
      { name: "description", content: "Manage super admins, hospital admins and staff members." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState<SysUser[]>(() => {
    if (typeof window === "undefined") return INITIAL;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? (JSON.parse(raw) as SysUser[]) : INITIAL;
    } catch {
      return INITIAL;
    }
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SysUser | null>(null);
  const [deleting, setDeleting] = useState<SysUser | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(users));
    } catch {
      /* ignore */
    }
  }, [users]);

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

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.tenant.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} of {users.length} accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, institution…"
              className="pl-9 w-64"
            />
          </div>
          <Button className="bg-blood hover:bg-blood-dark text-white" onClick={openAdd}>
            <Plus className="size-4" /> Add user
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Institution</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No users match your search.
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => openEdit(u)}
              >
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
                <td
                  className="px-6 py-3.5 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
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
                  </div>
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

const NATIONAL_TENANT = "National Blood Service Zimbabwe";

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

  const hospitalOptions = HOSPITALS.filter((h) => h.type === "hospital").map((h) => h.name);

  const tenantOptions = form.role === "Super Admin" ? [NATIONAL_TENANT] : hospitalOptions;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant =
      form.role === "Super Admin" ? NATIONAL_TENANT : form.tenant || tenantOptions[0] || "";
    onSubmit({
      id: editing?.id ?? `u_${Date.now()}`,
      status: editing?.status ?? "active",
      ...form,
      tenant,
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
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  role: v as SysRole,
                  tenant: v === "Super Admin" ? NATIONAL_TENANT : "",
                }))
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Super Admin">Super Admin</SelectItem>
                <SelectItem value="Hospital Admin">Hospital Admin</SelectItem>
                <SelectItem value="Staff Member">Staff Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Institution</Label>
            {form.role === "Super Admin" ? (
              <Input className="mt-1.5" value={NATIONAL_TENANT} disabled />
            ) : (
              <Select
                value={form.tenant}
                onValueChange={(v) => setForm((f) => ({ ...f, tenant: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a hospital" />
                </SelectTrigger>
                <SelectContent>
                  {tenantOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
