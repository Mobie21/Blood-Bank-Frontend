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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStaff,
  deleteStaff,
  listStaff,
  setStaffStatus,
  updateStaff,
  type StaffInput,
} from "@/lib/backend";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/staff")({
  head: () => ({
    meta: [
      { title: "Staff — HaemoCentral" },
      { name: "description", content: "Manage staff accounts, roles and departments for your institution." },
    ],
  }),
  component: StaffPage,
});

type StaffRole = "hospital_admin" | "staff";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: StaffRole;
  status: "active" | "suspended";
}

function StaffPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["staff"], queryFn: listStaff });
  const staff: StaffMember[] = (data?.data ?? []).map((u) => ({
    id: u._id,
    name: u.fullName,
    email: u.email,
    phone: u.phone ?? "",
    department: u.department ?? "",
    position: u.designation ?? "",
    role: u.role === "hospital_admin" ? "hospital_admin" : "staff",
    status: u.status,
  }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["staff"] });
  const fail = (e: Error) => toast.error("Action failed", { description: e.message });

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (s: StaffMember) => {
    setEditing(s);
    setDialogOpen(true);
  };
  const statusM = useMutation({
    mutationFn: (s: StaffMember) => setStaffStatus(s.id, s.status === "active" ? "suspend" : "activate"),
    onSuccess: (_d, s) => {
      toast.success(`${s.name} ${s.status === "active" ? "suspended" : "reinstated"}`);
      refresh();
    },
    onError: fail,
  });
  const toggleStatus = (s: StaffMember) => statusM.mutate(s);
  const deleteM = useMutation({
    mutationFn: (s: StaffMember) => deleteStaff(s.id),
    onSuccess: (_d, s) => {
      toast.success(`${s.name} removed`);
      refresh();
    },
    onError: fail,
  });
  const confirmDelete = () => {
    if (!deleting) return;
    deleteM.mutate(deleting);
    setDeleting(null);
  };
  const saveM = useMutation({
    mutationFn: async (s: StaffMember) => {
      const body: StaffInput = {
        fullName: s.name,
        email: s.email,
        phone: s.phone || undefined,
        department: s.department || undefined,
        designation: s.position || undefined,
        role: s.role,
      };
      if (editing) return updateStaff(s.id, body);
      return createStaff(body);
    },
    onSuccess: (res, s) => {
      const temp = (res as { temporary_password?: string }).temporary_password;
      toast.success(`${s.name} ${editing ? "updated" : "added"}`, {
        description: temp ? `Temporary password: ${temp}` : undefined,
        duration: temp ? 20000 : undefined,
      });
      setDialogOpen(false);
      refresh();
    },
    onError: fail,
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">{isLoading ? "Loading..." : `${staff.length} members`}</p>
        </div>
        <Button className="bg-blood hover:bg-blood-dark text-white" onClick={openAdd}>
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
            {staff.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {isLoading
                    ? "Loading..."
                    : error
                      ? (error as Error).message
                      : 'No staff members yet. Click "Add staff member" to add one.'}
                </td>
              </tr>
            )}
            {staff.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => openEdit(s)}
              >
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
                    {s.status === "active" ? "active" : "suspended"}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
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
                      <DropdownMenuItem onClick={() => openEdit(s)}>
                        <Pencil className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(s)}>
                        <Power className="size-4" />
                        {s.status === "active" ? "Suspend" : "Reinstate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleting(s)}
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

      <StaffDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSubmit={(s) => saveM.mutate(s)}
        onSuspend={
          editing
            ? () => {
                toggleStatus(editing);
                setDialogOpen(false);
              }
            : undefined
        }
        onDelete={
          editing
            ? () => {
                setDialogOpen(false);
                setDeleting(editing);
              }
            : undefined
        }
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this staff member from your institution.
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

function StaffDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  onSuspend,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: StaffMember | null;
  onSubmit: (s: StaffMember) => void;
  onSuspend?: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    department: editing?.department ?? "Blood Bank",
    position: editing?.position ?? "",
    role: editing?.role ?? ("staff" as StaffRole),
  });

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: editing?.id ?? `s_${Date.now()}`,
      status: editing?.status ?? "active",
      ...form,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit staff member" : "Add staff member"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this staff member's details, or suspend / remove their account."
              : "Add a new staff member to your institution."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs">Full name</Label>
            <Input className="mt-1.5" required value={form.name} onChange={set("name")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email</Label>
              <Input className="mt-1.5" type="email" required value={form.email} onChange={set("email")} />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input className="mt-1.5" value={form.phone} onChange={set("phone")} placeholder="+263 772 000 000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Department</Label>
              <Input className="mt-1.5" required value={form.department} onChange={set("department")} />
            </div>
            <div>
              <Label className="text-xs">Position</Label>
              <Input className="mt-1.5" required value={form.position} onChange={set("position")} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v as StaffRole }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hospital_admin">Hospital Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:gap-2">
            {editing ? (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onSuspend}>
                  {editing.status === "active" ? "Suspend" : "Reinstate"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blood hover:bg-blood-dark text-white">
                {editing ? "Save changes" : "Add staff member"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
