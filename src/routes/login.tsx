import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTenant } from "@/lib/tenant-context";
import { findUser } from "@/lib/mock-users";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — HaemoCentral" },
      { name: "description", content: "Sign in to the HaemoCentral national blood bank management system." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setRole } = useTenant();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = findUser(email, password);
      if (!user) {
        setLoading(false);
        toast.error("Invalid credentials", {
          description: "Check your email and password and try again.",
        });
        return;
      }
      setRole(user.role);
      toast.success(`Welcome, ${user.name}`);
      navigate({ to: user.role === "super_admin" ? "/admin" : "/dashboard" });
    }, 400);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-canvas">
      {/* Left brand panel */}
      <div className="hidden md:flex bg-sidebar text-sidebar-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <div className="size-10 rounded-lg bg-white/10 ring-1 ring-white/20 grid place-items-center">
            <Activity className="size-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-semibold tracking-tight text-lg">HaemoCentral</div>
            <div className="text-[10px] uppercase tracking-widest text-white/50">
              National Blood Management
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight text-balance">
            One trusted network for every unit of blood.
          </h2>
          <p className="mt-4 text-sm text-white/60 text-pretty">
            Hospitals and laboratories nationwide, coordinating inventory and critical transfusions
            through a single secure platform.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-white/60 shrink-0" />
              Real-time inventory across every registered institution
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-white/60 shrink-0" />
              Nationwide search for rare blood groups
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 size-1.5 rounded-full bg-white/60 shrink-0" />
              Role-based access with strict tenant isolation
            </li>
          </ul>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-white/40 relative z-10">
          © HaemoCentral · Ministry of Health
        </div>

        <div className="absolute -right-24 -bottom-24 size-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-16 top-32 size-64 bg-blood-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your institution credentials to continue.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-blood hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-blood hover:bg-blood-dark text-white"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
