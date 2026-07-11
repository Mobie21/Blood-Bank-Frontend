import { createFileRoute } from "@tanstack/react-router";
import { HOSPITALS } from "@/lib/mock-data";
import { InstitutionTable } from "./_shell.admin.hospitals";

export const Route = createFileRoute("/_shell/admin/laboratories")({
  head: () => ({
    meta: [
      { title: "Laboratories — HaemoCentral" },
      { name: "description", content: "Manage registered laboratories across the national network." },
    ],
  }),
  component: () => <InstitutionTable title="Laboratories" items={HOSPITALS.filter((h) => h.type === "laboratory")} />,
});
