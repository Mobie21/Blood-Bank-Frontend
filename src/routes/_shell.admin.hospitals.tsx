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
  createInstitution,
  deleteInstitution,
  listInstitutions,
  setInstitutionStatus,
  updateInstitution,
  type Institution,
  type InstitutionInput,
} from "@/lib/backend";

type Hospital = Institution;
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  return <InstitutionTable title="Hospitals" type="hospital" />;
}

export function InstitutionTable({ title, type }: { title: string; type: "hospital" | "laboratory" }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["institutions", type],
    queryFn: () => listInstitutions(type),
  });
  const items = data ?? [];
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["institutions"] });
    qc.invalidateQueries({ queryKey: ["admin"] });
  };
  const fail = (e: Error) => toast.error("Action failed", { description: e.message });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Hospital | null>(null);
  const [deleting, setDeleting] = useState<Hospital | null>(null);
  const noun = title.slice(0, -1).toLowerCase();

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (h: Hospital) => {
    setEditing(h);
    setDialogOpen(true);
  };
  const statusM = useMutation({
    mutationFn: (h: Hospital) => setInstitutionStatus(h.id, h.status === "active" ? "suspended" : "active"),
    onSuccess: (_d, h) => {
      toast.success(`${h.name} ${h.status === "active" ? "deactivated" : "activated"}`);
      refresh();
    },
    onError: fail,
  });
  const toggleStatus = (h: Hospital) => statusM.mutate(h);
  const deleteM = useMutation({
    mutationFn: (h: Hospital) => deleteInstitution(h.id),
    onSuccess: (_d, h) => {
      toast.success(`${h.name} removed`);
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
    mutationFn: (body: InstitutionInput) =>
      editing ? updateInstitution(editing.id, body) : createInstitution(body),
    onSuccess: (_d, body) => {
      toast.success(`${body.name} ${editing ? "updated" : "registered"}`);
      setDialogOpen(false);
      refresh();
    },
    onError: fail,
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isLoading ? "Loading..." : `${items.length} registered`}</p>
        </div>
        <Button className="bg-blood hover:bg-blood-dark text-white" onClick={openAdd}>
          <Plus className="size-4" /> Add {noun}
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
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {isLoading
                    ? "Loading..."
                    : error
                      ? (error as Error).message
                      : `No ${noun}s yet. Click "Add ${noun}" to register one.`}
                </td>
              </tr>
            )}
            {items.map((h) => (
              <tr key={h.id} className="hover:bg-muted/30">
                <td className="px-6 py-3.5">
                  <div className="font-medium text-foreground">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.bloodDeptContact ?? ""}</div>
                </td>
                <td className="px-6 py-3.5 text-muted-foreground font-mono">{h.code}</td>
                <td className="px-6 py-3.5 text-muted-foreground">
                  {h.city}, {h.province}
                </td>
                <td className="px-6 py-3.5 text-muted-foreground">
                  <div>{h.phone}</div>
                  <div className="text-xs">{h.email}</div>
                </td>
                <td className="px-6 py-3.5 font-mono">{h.total_units.toLocaleString()}</td>
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
                      <DropdownMenuItem onClick={() => openEdit(h)}>
                        <Pencil className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(h)}>
                        <Power className="size-4" />
                        {h.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleting(h)}
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

      <InstitutionDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={type}
        noun={noun}
        editing={editing}
        onSubmit={(body) => saveM.mutate(body)}
        saving={saveM.isPending}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this {noun} and its association from the network.
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

function InstitutionDialog({
  open,
  onOpenChange,
  type,
  noun,
  editing,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: "hospital" | "laboratory";
  noun: string;
  editing: Hospital | null;
  onSubmit: (h: InstitutionInput) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    address: editing?.address ?? "",
    city: editing?.city ?? "",
    province: editing?.province ?? "",
    bloodDeptContact: editing?.bloodDeptContact ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const opt = (v: string) => v.trim() || undefined;
    onSubmit({
      type,
      name: form.name.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      email: opt(form.email),
      phone: opt(form.phone),
      address: opt(form.address),
      bloodDeptContact: opt(form.bloodDeptContact),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit ${noun}` : `Register ${noun}`}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `Update details for this ${noun}.`
              : `Add a new ${noun} to the national HaemoCentral network.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required value={form.name} onChange={set("name")} />
            <Field label="Blood dept. contact" value={form.bloodDeptContact} onChange={set("bloodDeptContact")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" type="email" value={form.email} onChange={set("email")} />
            <Field label="Phone" value={form.phone} onChange={set("phone")} />
          </div>
          <Field label="Address" value={form.address} onChange={set("address")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" required value={form.city} onChange={set("city")} />
            <Field label="Province" required value={form.province} onChange={set("province")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-blood hover:bg-blood-dark text-white">
              {saving ? "Saving..." : editing ? "Save changes" : `Register ${noun}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1.5" {...props} />
    </div>
  );
}
