import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, Database, DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useStation } from "@/components/station-context";
import {
  BulletGauge,
  PageHeader,
  Panel,
  RadialGauge,
  SourceTag,
  StatCard,
} from "@/components/telemetry";
import {
  consumptionSeries,
  fuelPercent,
  runwayDays,
  severityForRunway,
} from "@/lib/station-data";
import { axisProps, chartTooltip } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fuel")({
  head: () => ({
    meta: [
      { title: "Fuel & Runway — Polar Station Energy Command" },
      {
        name: "description",
        content:
          "Fuel tank level, 30-day consumption trend and days-until-empty projection with a crisis-multiplier stress test.",
      },
      { property: "og:title", content: "Fuel & Runway — Polar Station Energy Command" },
      {
        property: "og:description",
        content: "Tank level, burn rate and delayed-resupply stress testing per station.",
      },
    ],
  }),
  component: FuelPage,
});

const PRESETS = [
  { label: "1.00x Nominal", value: 1.0 },
  { label: "1.25x Cold Snap", value: 1.25 },
  { label: "1.50x Delayed Ship", value: 1.5 },
  { label: "1.80x Extreme Surge", value: 1.8 },
];

function FuelPage() {
  const { station, telemetry } = useStation();
  const [multiplier, setMultiplier] = useState(1);
  const series = useMemo(() => consumptionSeries(station), [station.id]);
  const baseDays = runwayDays(station);
  const days = runwayDays(station, multiplier);
  const sev = severityForRunway(days);
  const isHimadri = station.sharedInfrastructure;

  const emptyDate = new Date(Date.UTC(2026, 8, 4) + days * 86_400_000).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <PageHeader
        title={`${station.name} — Fuel & Runway`}
        subtitle={`${station.fuelType} · resupply-window stress testing`}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={isHimadri ? "Backup Tank Level" : "Tank Level"} source="Est. from historical delivery data" bodyClassName="flex flex-col items-center justify-center">
          <RadialGauge
            value={fuelPercent(station)}
            label="usable capacity"
            sublabel={`${station.fuelRemainingL.toLocaleString()} L of ${station.fuelCapacityL.toLocaleString()} L`}
            severity={fuelPercent(station) < 30 ? "critical" : fuelPercent(station) < 55 ? "warning" : "nominal"}
          />
          <div className="mt-4 flex items-center justify-between w-full border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span>Instantaneous Flow:</span>
            <span className="data-num font-semibold text-foreground">{telemetry.flowRateLph} L/h</span>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-2"
          title="Crisis Multiplier — Delayed Resupply Stress Test"
          description="Scale daily burn to simulate colder-than-planned seasons or a delayed ice-class resupply vessel."
          source="Modelled projection"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`data-num text-5xl font-semibold ${
                    sev === "critical" ? "text-critical" : sev === "warning" ? "text-warning" : "text-nominal"
                  }`}
                >
                  {Math.round(days)}
                </span>
                <span className="text-sm text-muted-foreground">days until empty</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Projected dry tank date: <span className="data-num font-medium text-foreground">{emptyDate}</span>
                {multiplier > 1 && (
                  <>
                    {" "}
                    · <span className="text-warning font-medium">{Math.round(baseDays - days)} days lost</span> vs baseline
                  </>
                )}
              </p>

              {/* Slider & Presets */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Crisis Burn Multiplier</span>
                  <span className="data-num font-semibold text-primary">{multiplier.toFixed(2)}x</span>
                </div>
                <Slider
                  className="mt-3"
                  min={1}
                  max={1.8}
                  step={0.05}
                  value={[multiplier]}
                  onValueChange={(val) => {
                    const v = val?.[0];
                    setMultiplier(typeof v === "number" && !isNaN(v) ? v : 1);
                  }}
                />
                
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setMultiplier(p.value)}
                      className={cn(
                        "rounded border px-2 py-1 text-[11px] font-medium transition-colors",
                        multiplier === p.value
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <BulletGauge
                value={Math.round(days)}
                min={0}
                typical={[120, 240]}
                max={Math.max(365, Math.round(baseDays))}
                label="Runway vs Antarctic Resupply Window"
                unit="days"
              />
              <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                Effective burn at <strong className="text-foreground">{multiplier.toFixed(2)}x</strong>:{" "}
                <span className="data-num font-semibold text-foreground">
                  {Math.round(station.dailyConsumptionL * multiplier).toLocaleString()} L/day
                </span>
                <div className="mt-2">
                  <SourceTag source="Modelled projection" />
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Baseline burn"
          value={station.dailyConsumptionL.toLocaleString()}
          unit="L/day"
          icon={Flame}
          source="Flow Meter Array"
        />
        <StatCard
          label="Tank capacity"
          value={station.fuelCapacityL.toLocaleString()}
          unit="L"
          icon={Database}
          source="NCPOR Logistics Manifest"
        />
        <StatCard
          label="Fuel cost exposure"
          value={`$${Math.round((station.fuelRemainingL * station.fuelCostPerLitre) / 1000).toLocaleString()}k`}
          unit="USD"
          icon={DollarSign}
          hint={`At $${station.fuelCostPerLitre.toFixed(2)}/L landed cost`}
          source="NCPOR Finance Record"
        />
      </div>

      <Panel
        className="mt-4"
        title="Consumption trend — last 30 days"
        description="Daily fuel burn compared to baseline and crisis scenario thresholds."
        source="Fuel Depot Telemetry"
      >
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" {...axisProps} interval={3} />
              <YAxis {...axisProps} unit=" L" />
              <RTooltip {...chartTooltip} />
              <ReferenceLine
                y={station.dailyConsumptionL * multiplier}
                stroke="var(--warning)"
                strokeDasharray="4 4"
                label={{ value: "stress threshold", fill: "var(--warning)", fontSize: 10, position: "right" }}
              />
              <Line
                type="monotone"
                dataKey="litres"
                name="Daily burn"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                name="Baseline"
                stroke="var(--muted-foreground)"
                strokeDasharray="5 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}

