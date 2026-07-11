import { createFileRoute } from "@tanstack/react-router";
import { useTenant } from "@/lib/tenant-context";
import { Mail, Building2, Shield } from "lucide-react";

export const Route = createFileRoute("/_shell/profile")({
  head: () => ({ meta: [{ title: "Profile — HaemoCentral" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useTenant();
  const roleLabel = {
    super_admin: "Super Administrator",
    hospital_admin: "Hospital Administrator",
    lab_admin: "Laboratory Administrator",
  }[user.role];

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account details.</p>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card p-6 md:p-8 max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-blood/10 grid place-items-center text-blood font-semibold text-xl">
            {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        <dl className="mt-8 space-y-4 text-sm">
          <Row icon={Mail} label="Email" value={user.email} />
          <Row icon={Building2} label="Institution" value={user.tenant.name} />
          <Row icon={Shield} label="Role" value={roleLabel} />
        </dl>
      </div>
    </>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="text-sm text-foreground">{value}</dd>
      </div>
    </div>
  );
}
