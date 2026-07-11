import { createFileRoute } from "@tanstack/react-router";
import { NOTIFICATIONS } from "@/lib/mock-data";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — HaemoCentral" },
      { name: "description", content: "System alerts, low stock warnings and expiring blood unit notifications." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {NOTIFICATIONS.filter((n) => !n.read).length} unread
        </p>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card divide-y divide-border">
        {NOTIFICATIONS.map((n) => {
          const Icon =
            n.severity === "critical" ? AlertCircle : n.severity === "warning" ? AlertTriangle : Info;
          const tone =
            n.severity === "critical"
              ? "bg-red-100 text-red-700"
              : n.severity === "warning"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700";
          return (
            <div
              key={n.id}
              className={cn("p-5 flex gap-4 items-start", !n.read && "bg-blood/[0.02]")}
            >
              <div className={cn("size-9 rounded-lg grid place-items-center shrink-0", tone)}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{n.title}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">{n.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
              </div>
              {!n.read && <span className="size-2 rounded-full bg-blood mt-2 shrink-0" />}
            </div>
          );
        })}
      </div>
    </>
  );
}
