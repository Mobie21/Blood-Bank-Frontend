import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HOSPITALS, type Hospital } from "@/lib/mock-data";
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
  const [items, setItems] = useState<Hospital[]>(
    HOSPITALS.filter((h) => h.type === "laboratory"),
  );
  return (
    <InstitutionTable
      title="Laboratories"
      type="laboratory"
      items={items}
      onAdd={(h) => setItems((prev) => [h, ...prev])}
    />
  );
}
