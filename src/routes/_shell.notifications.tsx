import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  timeAgo,
} from "@/lib/backend";

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
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["notifications"], queryFn: listNotifications });
  const items = data?.data ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const fail = (e: Error) => toast.error("Action failed", { description: e.message });

  const readOne = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh, onError: fail });
  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refresh();
    },
    onError: fail,
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "Loading..." : `${data?.unread ?? 0} unread`}
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!data?.unread || readAll.isPending}
          onClick={() => readAll.mutate()}
        >
          Mark all as read
        </Button>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card divide-y divide-border">
        {items.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {isLoading ? "Loading..." : error ? (error as Error).message : "No notifications yet."}
          </div>
        )}
        {items.map((n) => {
          const unread = !n.readAt;
          const Icon =
            n.severity === "critical" ? AlertCircle : n.severity === "warning" ? AlertTriangle : Info;
          const tone =
            n.severity === "critical"
              ? "bg-red-100 text-red-700"
              : n.severity === "warning"
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700";
          return (
            <button
              type="button"
              key={n._id}
              onClick={() => unread && readOne.mutate(n._id)}
              className={cn(
                "w-full text-left p-5 flex gap-4 items-start",
                unread && "bg-blood/[0.02] hover:bg-muted/40",
              )}
            >
              <div className={cn("size-9 rounded-lg grid place-items-center shrink-0", tone)}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{n.title}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
                </div>
                {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
              </div>
              {unread && <span className="size-2 rounded-full bg-blood mt-2 shrink-0" />}
            </button>
          );
        })}
      </div>
    </>
  );
}
