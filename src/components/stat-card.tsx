import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  hintTone?: "default" | "success" | "warning" | "critical" | "muted";
  icon?: LucideIcon;
}

export function StatCard({ label, value, hint, hintTone = "default", icon: Icon }: Props) {
  const toneClass = {
    default: "text-muted-foreground",
    success: "text-emerald-600",
    warning: "text-amber-600",
    critical: "text-blood",
    muted: "text-muted-foreground",
  }[hintTone];

  const valueTone = hintTone === "critical" ? "text-blood" : "text-foreground";

  return (
    <div className="bg-card p-5 rounded-xl ring-1 ring-black/5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground/70" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("text-2xl font-semibold", valueTone)}>{value}</span>
        {hint && <span className={cn("text-[10px] font-medium tracking-tight", toneClass)}>{hint}</span>}
      </div>
    </div>
  );
}
