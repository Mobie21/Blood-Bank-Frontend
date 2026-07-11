import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
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
import { HOSPITALS, totalStock, BLOOD_GROUPS, type Hospital, type BloodGroup } from "@/lib/mock-data";
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
  const [items, setItems] = useState<Hospital[]>(HOSPITALS.filter((h) => h.type === "hospital"));
  return (
    <InstitutionTable
      title="Hospitals"
      type="hospital"
      items={items}
      onAdd={(h) => setItems((prev) => [h, ...prev])}
    />
  );
}

export function InstitutionTable({
  title,
  type,
  items,
  onAdd,
}: {
  title: string;
  type: "hospital" | "laboratory";
  items: Hospital[];
  onAdd: (h: Hospital) => void;
}) {
  const [open, setOpen] = useState(false);
  const noun = title.slice(0, -1).toLowerCase();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} registered</p>
        </div>
        <Button
          className="bg-blood hover:bg-blood-dark text-white"
          onClick={() => setOpen(true)}
        >
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

      <AddInstitutionDialog
        open={open}
        onOpenChange={setOpen}
        type={type}
        noun={noun}
        onAdd={(h) => {
          onAdd(h);
          toast.success(`${h.name} registered`);
          setOpen(false);
        }}
      />
    </>
  );
}

function AddInstitutionDialog({
  open,
  onOpenChange,
  type,
  noun,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: "hospital" | "laboratory";
  noun: string;
  onAdd: (h: Hospital) => void;
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    country: "Kenya",
    bloodDeptContact: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const emptyStock = BLOOD_GROUPS.reduce(
      (acc, g) => ({ ...acc, [g]: 0 }),
      {} as Record<BloodGroup, number>,
    );
    const prefix = type === "hospital" ? "h_" : "l_";
    onAdd({
      id: `${prefix}${Date.now()}`,
      type,
      status: "active",
      stock: emptyStock,
      ...form,
    });
    setForm({
      code: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      country: "Kenya",
      bloodDeptContact: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register {noun}</DialogTitle>
          <DialogDescription>
            Add a new {noun} to the national HaemoCentral network.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required value={form.name} onChange={set("name")} />
            <Field label="Code" required value={form.code} onChange={set("code")} placeholder="e.g. SJMC-05" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" type="email" required value={form.email} onChange={set("email")} />
            <Field label="Phone" required value={form.phone} onChange={set("phone")} />
          </div>
          <Field label="Address" value={form.address} onChange={set("address")} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="City" required value={form.city} onChange={set("city")} />
            <Field label="Province" value={form.province} onChange={set("province")} />
            <Field label="Country" value={form.country} onChange={set("country")} />
          </div>
          <Field
            label="Blood dept. contact"
            value={form.bloodDeptContact}
            onChange={set("bloodDeptContact")}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blood hover:bg-blood-dark text-white">
              Register {noun}
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
