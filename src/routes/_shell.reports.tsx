import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const REPORTS = [
  { title: "Blood Stock", desc: "Complete inventory snapshot across all groups." },
  { title: "Blood by Group", desc: "Distribution and trends by ABO/Rh group." },
  { title: "Blood Expiry", desc: "Units expiring in the next 7, 14, and 30 days." },
  { title: "Institution Summary", desc: "Registered institutions with status and contact." },
  { title: "Staff Summary", desc: "Active staff, roles, and departments." },
  { title: "Blood Availability", desc: "Nationwide availability by region and group." },
];

export const Route = createFileRoute("/_shell/reports")({
  head: () => ({
    meta: [
      { title: "Reports — HaemoCentral" },
      { name: "description", content: "Generate and export operational reports on stock, staff and availability." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and export operational reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {REPORTS.map((r) => (
          <div
            key={r.title}
            className="bg-card rounded-xl ring-1 ring-black/5 shadow-card p-5 flex flex-col"
          >
            <div className="size-10 rounded-lg bg-blood/10 grid place-items-center text-blood mb-4">
              <FileText className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground">{r.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 flex-1">{r.desc}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(["PDF", "Excel", "CSV"] as const).map((fmt) => (
                <Button
                  key={fmt}
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success(`${r.title} exported as ${fmt}`)}
                >
                  <Download className="size-3.5" /> {fmt}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
