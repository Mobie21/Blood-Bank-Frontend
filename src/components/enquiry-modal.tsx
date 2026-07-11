import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Hospital, BloodGroup } from "@/lib/mock-data";
import { Mail, Phone, MapPin, User, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hospital: Hospital | null;
  group: BloodGroup;
}

export function EnquiryModal({ open, onOpenChange, hospital, group }: Props) {
  if (!hospital) return null;
  const available = hospital.stock[group];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{hospital.name}</DialogTitle>
          <DialogDescription>
            Contact this institution directly to arrange transfer. No stock is moved automatically.
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
          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-700 uppercase tracking-wider">
            In stock
          </span>
        </div>

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

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button asChild className="bg-blood hover:bg-blood-dark text-white">
            <a href={`mailto:${hospital.email}?subject=Blood%20enquiry:%20${encodeURIComponent(group)}`}>
              Send enquiry
            </a>
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
