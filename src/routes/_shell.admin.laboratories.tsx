import { createFileRoute } from "@tanstack/react-router";
import { InstitutionTable } from "./_shell.admin.hospitals";

export const Route = createFileRoute("/_shell/admin/laboratories")({
  head: () => ({
    meta: [
      { title: "Laboratories — HaemoCentral" },
      { name: "description", content: "Manage registered laboratories across the national network." },
    ],
  }),
  component: LaboratoriesPage,
});

function LaboratoriesPage() {
  return <InstitutionTable title="Laboratories" type="laboratory" />;
}
