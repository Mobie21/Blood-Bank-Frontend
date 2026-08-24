import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Hospital, BloodGroup } from "@/lib/mock-data";
import { Mail, Phone, MapPin, User, Droplet, Send, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addEnquiry } from "@/lib/enquiries";
import { useTenant } from "@/lib/tenant-context";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hospital: Hospital | null;
  group: BloodGroup;
}

type Mode = "enquire" | "order";

export function EnquiryModal({ open, onOpenChange, hospital, group }: Props) {
  const { user } = useTenant();
  const [mode, setMode] = useState<Mode>("enquire");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("enquire");
      setQuantity(1);
      setNotes("");
    }
  }, [open, hospital?.id]);

  if (!hospital) return null;
  const available = hospital.stock[group];
  const canOrder = available > 0;
  const qtyValid = quantity >= 1 && quantity <= available;

  const handleSubmit = async () => {
    if (mode === "order" && !qtyValid) {
      toast.error("Invalid quantity", { description: `Available stock: ${available} units.` });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);

    const ref = `ENQ-${Date.now().toString().slice(-6)}`;
    addEnquiry({
      reference: ref,
      kind: mode === "order" ? "order" : "enquiry",
      group,
      quantity: mode === "order" ? quantity : 0,
      notes,
      supplierId: hospital.id,
      supplierName: hospital.name,
      requesterTenantId: user.tenant.id,
      requesterTenantName: user.tenant.name,
      requesterName: user.name,
      status: "pending",
    });

    if (mode === "order") {
      toast.success("Order placed", {
        description: `${quantity} unit${quantity > 1 ? "s" : ""} of ${group} requested from ${hospital.name}. Ref ${ref}.`,
      });
    } else {
      toast.success("Enquiry sent", {
        description: `${hospital.name} has been notified about ${group}. Ref ${ref}.`,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{hospital.name}</DialogTitle>
          <DialogDescription>
            Send an enquiry or place an order. Confirmed orders are logged and the institution is notified.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-lg bg-blood/5 border border-blood/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-blood/10 grid place-items-center">
              <Droplet className="size-5 text-blood" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Available</p>
              <p className="text-lg font-semibold text-foreground">{available} units · {group}</p>
            </div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wider ${canOrder ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            {canOrder ? "In stock" : "Out of stock"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setMode("enquire")}
            className={`text-sm font-medium py-2 rounded-md transition-colors ${mode === "enquire" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Enquire
          </button>
          <button
            type="button"
            onClick={() => canOrder && setMode("order")}
            disabled={!canOrder}
            className={`text-sm font-medium py-2 rounded-md transition-colors ${mode === "order" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"}`}
          >
            Place order
          </button>
        </div>

        {mode === "order" ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Quantity (units)
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</Button>
                <Input
                  type="number"
                  min={1}
                  max={available}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(available, Number(e.target.value) || 1)))}
                  className="text-center"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setQuantity((q) => Math.min(available, q + 1))}>+</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setQuantity(available)}>Max</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Max {available} units available. You are requesting {quantity} of {group}.
              </p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Notes for the supplier (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Urgency, patient reference, collection window…"
                className="mt-1.5 min-h-20"
              />
            </div>
          </div>
        ) : (
          <dl className="mt-4 space-y-3 text-sm">
            <Row icon={User} label="Contact person" value={hospital.bloodDeptContact} />
            <Row icon={Phone} label="Phone" value={hospital.phone} href={`tel:${hospital.phone}`} />
            <Row icon={Mail} label="Email" value={hospital.email} href={`mailto:${hospital.email}`} />
            <Row
              icon={MapPin}
              label="Address"
              value={`${hospital.address}, ${hospital.city}, ${hospital.province}`}
            />
          </dl>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (mode === "order" && !qtyValid)}
            className="bg-blood hover:bg-blood-dark text-white"
          >
            {mode === "order" ? (
              <>
                <ShoppingCart className="size-4" />
                {submitting ? "Placing…" : `Confirm order (${quantity})`}
              </>
            ) : (
              <>
                <Send className="size-4" />
                {submitting ? "Sending…" : "Send enquiry"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof User;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="text-sm text-foreground truncate">
          {href ? (
            <a href={href} className="hover:text-blood">
              {value}
            </a>
          ) : (
            value
          )}
        </dd>
      </div>
    </div>
  );
}
