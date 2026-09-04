import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Moon, Sun, Zap, Radio, Fuel, Gauge, Clock, Thermometer, Wind } from "lucide-react";
import { useStation } from "@/components/station-context";
import {
  Panel,
  PageHeader,
  StatCard,
  SeverityBadge,
  BulletGauge,
} from "@/components/telemetry";
import {
  fuelPercent,
  powerSeries,
  runwayDays,
  severityForRunway,
} from "@/lib/station-data";
import { chartTooltip, axisProps } from "@/lib/chart-theme";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Mission Control — Polar Station Energy Command" },
      {
        name: "description",
        content:
          "Live energy telemetry for India's polar research stations: power draw, fuel runway, occupancy and polar day/night status.",
      },
      { property: "og:title", content: "Mission Control — Polar Station Energy Command" },
      {
        property: "og:description",
        content: "Power draw, fuel runway and occupancy across Bharati, Maitri and Himadri.",
      },
    ],
  }),
  component: DashboardOverview,
});

function DashboardOverview() {
  const { station, telemetry } = useStation();
  const series = useMemo(() => powerSeries(station), [station.id]);
  const days = runwayDays(station);
  const sev = severityForRunway(days);
  const isHimadri = station.sharedInfrastructure;

  return (
    <>
      <PageHeader
        title={`${station.name} — Mission Control`}
        subtitle={`${station.region} · ${station.fuelType}`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <SeverityBadge severity={sev} label={sev === "nominal" ? "All systems nominal" : `${sev} state`} />
          <span className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            {station.polarPhase === "polar day" ? (
              <Sun className="size-3.5 text-warning" />
            ) : (
              <Moon className="size-3.5 text-primary" />
            )}
            <span className="font-semibold text-foreground">{station.polarPhase}</span> · {station.daylightHours}h daylight
          </span>
        </div>
      </PageHeader>

      {/* Himadri Shared Infrastructure Context Banner */}
      {isHimadri && (
        <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-relaxed text-sky-950 shadow-xs">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sky-800">
            <Zap className="size-4" />
            <span>Ny-Ålesund Village Shared Grid Mode (Arctic Expedition Base)</span>
          </div>
          <p className="mt-1.5 text-sky-900 font-medium">
            Himadri is a seasonal research station located in Svalbard. Primary electrical power and space heating are imported directly from Ny-Ålesund's central municipal utility grid. Station-owned backup diesel generators are kept on standby. Fuel runway calculations apply exclusively to station backup reserves.
          </p>
        </div>
      )}

      {/* Stat Cards Grid - Visually Tailored per Station Type */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isHimadri ? "Village Grid Import" : "Current power draw"}
          value={telemetry.powerDrawKw.toFixed(1)}
          unit="kW"
          icon={Zap}
          hint={isHimadri ? "Imported from Ny-Ålesund grid" : `Genset capacity ${station.generatorCapacityKw} kW`}
          source="SCADA Bus Node"
        >
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-2">
            <span>Freq: <strong className="data-num font-semibold text-foreground">{telemetry.gridFrequencyHz.toFixed(2)} Hz</strong></span>
            <span className="flex items-center gap-1 text-nominal font-medium">
              <Radio className="size-3 live-dot" /> Live
            </span>
          </div>
        </StatCard>

        <StatCard
          label={isHimadri ? "Standby Genset Status" : "Capacity utilisation"}
          value={isHimadri ? "Standby" : `${telemetry.utilizationPct.toFixed(1)}`}
          unit={isHimadri ? "" : "%"}
          icon={Gauge}
          severity={!isHimadri && telemetry.utilizationPct > 80 ? "warning" : "nominal"}
          hint={isHimadri ? "60 kW diesel backup ready" : "Rolling 5-minute mean"}
          source="Grid Telemetry"
        />

        <StatCard
          label={isHimadri ? "Backup Tank Level" : "Fuel tank level"}
          value={fuelPercent(station).toFixed(1)}
          unit="%"
          icon={Fuel}
          hint={`${station.fuelRemainingL.toLocaleString()} L of ${station.fuelCapacityL.toLocaleString()} L`}
          source="Depot Gauge"
        />

        <StatCard
          label="Runway remaining"
          value={Math.round(days).toString()}
          unit="days"
          icon={Clock}
          severity={sev}
          hint={isHimadri ? `Emergency reserve at ${station.dailyConsumptionL} L/d` : `At ${station.dailyConsumptionL.toLocaleString()} L/day`}
          source="Modelled projection"
        />
      </div>

      {/* Main Content Layout */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title={isHimadri ? "Ny-Ålesund Grid Draw & Backup Load — last 24h" : "Station load — last 24h"}
          description={isHimadri ? "External grid power consumption with thermal heating demand." : "Total draw against generator capacity, with heating share highlighted."}
          source="Simulated sensor feed"
        >
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="kwFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" {...axisProps} interval={3} />
                <YAxis {...axisProps} unit=" kW" />
                <RTooltip {...chartTooltip} />
                <Area
                  type="monotone"
                  dataKey="kw"
                  name={isHimadri ? "Grid Draw" : "Total draw"}
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#kwFill)"
                />
                <Area
                  type="monotone"
                  dataKey="heating"
                  name="Heating Share"
                  stroke="var(--chart-3)"
                  strokeWidth={1.5}
                  fill="var(--chart-3)"
                  fillOpacity={0.08}
                />
                <Line
                  type="monotone"
                  dataKey="capacity"
                  name={isHimadri ? "Genset Ceiling" : "Capacity"}
                  stroke="var(--chart-4)"
                  strokeDasharray="5 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Occupancy & Berth Capacity" source="NCPOR Roster">
            <BulletGauge
              value={station.headcount}
              min={0}
              typical={station.typicalRange}
              max={station.maxCapacity}
              label={isHimadri ? "Arctic expedition team" : "Personnel on station"}
              unit="people"
            />
          </Panel>

          <Panel title="Station Technical Profile" source="Station Registry">
            <dl className="divide-y divide-border/60 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground font-medium">Mode</dt>
                <dd className="font-semibold text-foreground uppercase tracking-wider bg-card border border-border/80 px-2 py-0.5 rounded text-[11px]">
                  {station.operatingMode}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground font-medium">Established</dt>
                <dd className="data-num font-semibold text-foreground">{station.established}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Thermometer className="size-3.5 text-sky-400" /> Outside temp
                </dt>
                <dd className="data-num font-semibold text-foreground">{telemetry.tempC} °C</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Wind className="size-3.5 text-emerald-400" /> Wind speed
                </dt>
                <dd className="data-num font-semibold text-foreground">{telemetry.windSpeedMs} m/s</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground font-medium">Infrastructure</dt>
                <dd className="font-semibold text-foreground">
                  {station.sharedInfrastructure ? "Shared (Ny-Ålesund)" : "Standalone Microgrid"}
                </dd>
              </div>
            </dl>
            <p className="mt-3.5 text-xs leading-relaxed text-muted-foreground border-t border-border/60 pt-3">
              {station.summary}
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
