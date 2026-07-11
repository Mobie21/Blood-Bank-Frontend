import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/topbar";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <div className="flex min-h-screen bg-canvas text-foreground">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
