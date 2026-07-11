import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search as SearchIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INVENTORY, BLOOD_GROUPS, type BloodGroup } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/inventory")({
  head: () => ({
    meta: [
      { title: "Blood Inventory — HaemoCentral" },
      { name: "description", content: "Manage blood units, storage locations, expiry dates and stock levels for your institution." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<BloodGroup | "all">("all");
  const [open, setOpen] = useState(false);

  const filtered = INVENTORY.filter((u) => {
    if (group !== "all" && u.group !== group) return false;
    if (query && !`${u.id} ${u.donorNumber} ${u.storageLocation}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blood Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} units · updated live
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blood hover:bg-blood-dark text-white">
              <Plus className="size-4" /> Add blood unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add blood unit</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
                toast.success("Blood unit added to inventory");
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Blood group</Label>
                  <select className="mt-1.5 w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Quantity (bags)</Label>
                  <Input type="number" defaultValue={1} min={1} />
                </div>
                <div>
                  <Label>Collection date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Expiry date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Donor number</Label>
                  <Input placeholder="D-XXXX" />
                </div>
                <div>
                  <Label>Storage location</Label>
                  <Input placeholder="Rack A-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blood hover:bg-blood-dark text-white">
                  Save unit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card">
        <div className="p-4 md:p-5 flex flex-wrap gap-3 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search unit ID, donor, location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="border border-border rounded-md px-3 py-2 text-sm bg-background"
            value={group}
            onChange={(e) => setGroup(e.target.value as BloodGroup | "all")}
          >
            <option value="all">All groups</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
                <th className="px-6 py-3">Unit ID</th>
                <th className="px-6 py-3">Group</th>
                <th className="px-6 py-3">Donor</th>
                <th className="px-6 py-3">Collected</th>
                <th className="px-6 py-3">Expires</th>
                <th className="px-6 py-3">Storage</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => {
                const days = Math.round((new Date(u.expiryDate).getTime() - Date.now()) / 86_400_000);
                const tone =
                  u.status === "reserved"
                    ? "bg-blue-100 text-blue-700"
                    : days <= 3
                      ? "bg-red-100 text-red-700"
                      : days <= 7
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700";
                const label = u.status === "reserved" ? "Reserved" : days <= 3 ? "Critical" : days <= 7 ? "Warning" : "Available";
                return (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-6 py-3.5 font-medium text-foreground">#{u.id}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blood/10 text-blood font-semibold text-xs">
                        {u.group}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">{u.donorNumber}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{u.collectionDate}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{u.expiryDate}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" /> {u.storageLocation}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold", tone)}>
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
