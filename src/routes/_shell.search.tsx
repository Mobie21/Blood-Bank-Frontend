import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, MapPin, Phone, Mail, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BLOOD_GROUPS, type BloodGroup } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { searchBlood, type SearchResult } from "@/lib/backend";
import { EnquiryModal } from "@/components/enquiry-modal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/search")({
  head: () => ({
    meta: [
      { title: "Blood Search — HaemoCentral" },
      { name: "description", content: "Search blood availability across every registered hospital and laboratory in the country." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [group, setGroup] = useState<BloodGroup>("O-");
  const [province, setProvince] = useState("all");
  const [city, setCity] = useState("");
  const [minQty, setMinQty] = useState(1);
  const [selected, setSelected] = useState<SearchResult | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["search", group, minQty],
    queryFn: () => searchBlood({ group, min_quantity: minQty }),
  });
  const all = data?.data ?? [];

  const provinces = useMemo(
    () => Array.from(new Set(all.map((r) => r.institution.province))).sort(),
    [all],
  );

  const results = all
    .filter((r) => province === "all" || r.institution.province === province)
    .filter((r) => !city || r.institution.city.toLowerCase().includes(city.toLowerCase()));

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nationwide Blood Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search availability across every registered institution.
        </p>
      </div>

      <div className="bg-card rounded-xl ring-1 ring-black/5 shadow-card p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Blood group
            </label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as BloodGroup)}
              className="mt-1.5 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
            >
              {BLOOD_GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Province
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="mt-1.5 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="all">All provinces</option>
              {provinces.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              City
            </label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Any" className="mt-1.5" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Min. quantity
            </label>
            <Input
              type="number"
              min={1}
              value={minQty}
              onChange={(e) => setMinQty(Number(e.target.value) || 1)}
              className="mt-1.5"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => refetch()} className="w-full bg-blood hover:bg-blood-dark text-white">
              <SearchIcon className="size-4" /> Search
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{results.length}</span> institutions with{" "}
            <span className="text-blood font-semibold">{group}</span> available
          </p>
        </div>

        {results.length === 0 && (
          <div className="bg-card rounded-xl ring-1 ring-black/5 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Searching..." : error ? (error as Error).message : "No institutions match your filters."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((r) => {
            const h = r.institution;
            const qty = r.available;
            const availability = qty >= 50 ? "High" : qty >= 20 ? "Moderate" : "Low";
            const tone =
              qty >= 50
                ? "bg-emerald-100 text-emerald-700"
                : qty >= 20
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700";
            return (
              <div
                key={h.id}
                className="bg-card rounded-xl ring-1 ring-black/5 shadow-card p-5 hover:shadow-elevated transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground shrink-0" />
                      <h3 className="font-semibold text-foreground truncate">{h.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="size-3" /> {h.city}, {h.province}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wider", tone)}>
                    {availability}
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Available
                    </p>
                    <p className="text-2xl font-semibold text-foreground">
                      {qty} <span className="text-sm font-medium text-muted-foreground">units · {group}</span>
                    </p>
                  </div>
                  <Button
                    onClick={() => setSelected(r)}
                    className="bg-blood hover:bg-blood-dark text-white"
                  >
                    Enquire
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-xs">
                  {h.phone && (
                    <a
                      href={`tel:${h.phone}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-blood truncate"
                    >
                      <Phone className="size-3.5 shrink-0" /> {h.phone}
                    </a>
                  )}
                  <span className="flex items-center gap-2 text-muted-foreground truncate capitalize">
                    <Mail className="size-3.5 shrink-0" /> {h.blood_dept_contact ?? h.type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EnquiryModal
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        result={selected}
      />
    </>
  );
}
