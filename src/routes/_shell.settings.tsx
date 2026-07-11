import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTenant } from "@/lib/tenant-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings — HaemoCentral" },
      { name: "description", content: "Institution profile, notification preferences and security settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useTenant();
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Institution profile and preferences.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Settings saved");
        }}
        className="bg-card rounded-xl ring-1 ring-black/5 shadow-card p-6 md:p-8 space-y-8 max-w-3xl"
      >
        <section>
          <h2 className="font-semibold text-foreground">Institution</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input defaultValue={user.tenant.name} className="mt-1.5" />
            </div>
            <div>
              <Label>City</Label>
              <Input defaultValue={user.tenant.city} className="mt-1.5" />
            </div>
            <div>
              <Label>Province</Label>
              <Input defaultValue={user.tenant.province} className="mt-1.5" />
            </div>
            <div>
              <Label>Blood department contact</Label>
              <Input defaultValue={user.name} className="mt-1.5" />
            </div>
          </div>
        </section>

        <section className="border-t border-border pt-6">
          <h2 className="font-semibold text-foreground">Notifications</h2>
          <div className="mt-4 space-y-4">
            <SettingRow title="Low blood stock alerts" desc="Notify when any group falls below threshold." defaultChecked />
            <SettingRow title="Expiring blood units" desc="Warn 72 hours before expiry." defaultChecked />
            <SettingRow title="Enquiries from other institutions" desc="Instant notifications on new enquiries." defaultChecked />
            <SettingRow title="System announcements" desc="Ministry updates and system news." />
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" className="bg-blood hover:bg-blood-dark text-white">
            Save changes
          </Button>
        </div>
      </form>
    </>
  );
}

function SettingRow({ title, desc, defaultChecked }: { title: string; desc: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
