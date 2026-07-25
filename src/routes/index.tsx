import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const authed = window.sessionStorage.getItem("haemocentral.auth") === "1";
    const role = window.sessionStorage.getItem("haemocentral.role");
    if (!authed) throw redirect({ to: "/login" });
    throw redirect({ to: role === "super_admin" ? "/admin" : "/dashboard" });
  },
});
