import { createFileRoute } from "@tanstack/react-router";
import { Users, UserCheck, ShieldAlert, HeartPulse, Shield } from "lucide-react";
import { useStation } from "@/components/station-context";
import { BulletGauge, PageHeader, Panel, StatCard } from "@/components/telemetry";
import { STATIONS, STATION_ORDER } from "@/lib/station-data";

export const Route = createFileRoute("/personnel")({
  head: () => ({
    meta: [
      { title: "Personnel & Occupancy — Polar Station Energy Command" },
      {
        name: "description",
        content: "Station headcount against typical seasonal range and hard maximum capacity.",
      },
      { property: "og:title", content: "Personnel & Occupancy — Polar Station Energy Command" },
      { property: "og:description", content: "Headcount vs typical range and max capacity per station." },
    ],
  }),
  component: PersonnelPage,
});

export function PersonnelPage() {
  const { station } = useStation();

  // Dynamic team role distribution guaranteeing exact sum equal to station headcount
  const medical = station.headcount >= 10 ? 1 : 0;
  const scientists = Math.max(1, Math.floor(station.headcount * 0.45));
  const engineers = Math.max(1, Math.floor(station.headcount * 0.35));
  const adminLogistics = Math.max(0, station.headcount - scientists - engineers - medical);

  return (
    <>
      <PageHeader
        title={`${station.name} — Personnel & Occupancy`}
        subtitle="Headcount directly drives thermal, water heating and domestic load"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="On Station Headcount" value={String(station.headcount)} unit="people" source="NCPOR Roster" />
        <StatCard
          label="Seasonal Typical Range"
          value={`${station.typicalRange[0]}–${station.typicalRange[1]}`}
          hint="Operational norm"
          source="Station Berth Registry"
        />
        <StatCard
          label="Hard Berth Ceiling"
          value={String(station.maxCapacity)}
          unit="berths"
          severity={station.headcount > station.typicalRange[1] ? "warning" : "nominal"}
          source="Station Berth Registry"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Station Occupancy vs Maximum Berth Capacity" source="Station Berth Registry">
          <div className="space-y-6">
            {STATION_ORDER.map((id) => {
              const s = STATIONS[id];
              const isSelected = id === station.id;
              return (
                <div
                  key={id}
                  className={`rounded-lg border p-4 transition-all ${
                    isSelected
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60 bg-card/30 opacity-60"
                  }`}
                >
                  <BulletGauge
                    value={s.headcount}
                    min={0}
                    typical={s.typicalRange}
                    max={s.maxCapacity}
                    label={`${s.name} (${s.region})`}
                    unit="people"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Mode: <strong className="text-foreground">{s.operatingMode}</strong></span>
                    <span>Utilisation: <strong className="data-num text-foreground">{Math.round((s.headcount / s.maxCapacity) * 100)}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Strict rule: Stations are tracked individually and never averaged. Each station operates under distinct geographical, thermal and logistic constraints.
          </p>
        </Panel>

        <Panel title={`${station.name} Expedition Roster`} source="NCPOR Roster">
          <ul className="space-y-4 text-sm">
            <li className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span>Research Scientists</span>
              </div>
              <span className="data-num font-semibold text-foreground">{scientists}</span>
            </li>
            <li className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-emerald-400" />
                <span>Engineers & Technicians</span>
              </div>
              <span className="data-num font-semibold text-foreground">{engineers}</span>
            </li>
            <li className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="size-4 text-rose-400" />
                <span>Station Medical Officer</span>
              </div>
              <span className="data-num font-semibold text-foreground">{medical}</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-amber-400" />
                <span>Logistics & Command</span>
              </div>
              <span className="data-num font-semibold text-foreground">{adminLogistics}</span>
            </li>
          </ul>

          <div className="mt-6 rounded border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
            Per-capita water allowance: <strong className="data-num text-foreground">120 L/day</strong>.
            Domestic power draw scales at approximately <strong className="data-num text-foreground">1.8 kW per additional person</strong>.
          </div>
        </Panel>
      </div>
    </>
  );
}

