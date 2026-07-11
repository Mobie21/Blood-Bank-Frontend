import { BLOOD_GROUPS, type BloodGroup } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Props {
  stock: Record<BloodGroup, number>;
  criticalThreshold?: number;
}

export function BloodDistribution({ stock, criticalThreshold = 30 }: Props) {
  const max = Math.max(...BLOOD_GROUPS.map((g) => stock[g]), 1);

  return (
    <div className="flex items-end justify-between gap-3 md:gap-4 h-56">
      {BLOOD_GROUPS.map((group) => {
        const value = stock[group];
        const pct = Math.max((value / max) * 100, 3);
        const critical = value <= criticalThreshold;
        return (
          <div key={group} className="flex-1 flex flex-col items-center gap-3 min-w-0">
            <div className="relative w-full bg-muted/60 ring-1 ring-black/5 rounded-t-sm flex flex-col-reverse overflow-hidden h-full">
              <div
                className={cn(
                  "transition-all duration-700",
                  critical ? "bg-blood" : "bg-blood/70",
                )}
                style={{ height: `${pct}%` }}
              />
              <span className="absolute inset-x-0 top-2 text-center text-[10px] font-mono font-semibold text-foreground/80">
                {value}
              </span>
            </div>
            <span
              className={cn(
                "text-[11px] font-semibold",
                critical ? "text-blood" : "text-foreground/70",
              )}
            >
              {group}
            </span>
          </div>
        );
      })}
    </div>
  );
}
