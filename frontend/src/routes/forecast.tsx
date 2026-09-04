import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrainCircuit, SlidersHorizontal, Sparkles } from "lucide-react";
import { useStation } from "@/components/station-context";
import { PageHeader, Panel, StatCard } from "@/components/telemetry";
import { forecastSeries, runwayDays } from "@/lib/station-data";
import { axisProps, chartTooltip } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "Forecast — Polar Station Energy Command" },
      {
        name: "description",
        content: "Fuel-depletion forecast with confidence band and what-if stress scenarios.",
      },
      { property: "og:title", content: "Forecast — Polar Station Energy Command" },
      {
        property: "og:description",
        content: "90-day depletion curve with delayed resupply, extra personnel and storm-week scenarios.",
      },
    ],
  }),
  component: ForecastPage,
});

const SCENARIOS = [
  { id: "resupply", label: "Delayed Resupply (+30d)", factor: 0.0, note: "Vessel ice lockup delays tank refill" },
  { id: "personnel", label: "Extra Personnel (+8)", factor: 0.12, note: "Summer expedition surge" },
  { id: "storm", label: "Storm Week", factor: 0.22, note: "Sustained high heating demand" },
  { id: "deepfreeze", label: "Polar Blizzard (-40°C)", factor: 0.35, note: "Extreme heating demand peak" },
];

function ForecastPage() {
  const { station } = useStation();
  const [active, setActive] = useState<string[]>([]);
  const multiplier =
    1 + SCENARIOS.filter((s) => active.includes(s.id)).reduce((a, s) => a + s.factor, 0);
  const data = useMemo(() => forecastSeries(station, { multiplier }), [station.id, multiplier]);
  const days = runwayDays(station, multiplier);

  const toggle = (id: string) =>
    setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <>
      <PageHeader
        title={`${station.name} — AI Demand & Depletion Forecast`}
        subtitle="90-day fuel-depletion projection with confidence band & stress scenarios"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Projected runway"
          value={Math.round(days).toString()}
          unit="days"
          severity={days < 45 ? "critical" : days < 120 ? "warning" : "nominal"}
          source="Modelled projection"
        />
        <StatCard
          label="Scenario Load Factor"
          value={`${multiplier.toFixed(2)}x`}
          hint={active.length ? `${active.length} scenario(s) active` : "Nominal Baseline"}
          source="Modelled projection"
        />
        <StatCard
          label="Confidence Interval"
          value="95%"
          unit="band"
          hint="Widens with 90-day horizon"
          source="Modelled projection"
        />
      </div>

      <Panel
        className="mt-4"
        title="90-Day Depletion Trajectory & What-If Scenarios"
        source="Modelled projection"
        action={
          <div className="flex flex-wrap gap-1.5">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                title={s.note}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                  active.includes(s.id)
                    ? "border-primary/60 bg-primary/20 text-primary shadow-sm"
                    : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
              <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" {...axisProps} interval={9} />
              <YAxis {...axisProps} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <RTooltip {...chartTooltip} />
              <Area
                type="monotone"
                dataKey="lower"
                stackId="band"
                stroke="none"
                fill="transparent"
                name="Lower bound"
              />
              <Area
                type="monotone"
                dataKey="band"
                stackId="band"
                stroke="none"
                fill="var(--chart-1)"
                fillOpacity={0.15}
                name="95% Confidence Band"
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected Fuel (L)"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 rounded-md border border-border/70 bg-card/40 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <BrainCircuit className="size-4 text-primary" />
            <span>Predictive Fuel Depletion Engine</span>
          </div>
          <p className="mt-1 leading-relaxed">
            90-day depletion projections are generated via historical seasonality vectors and time-series demand forecasting. Shaded band indicates the 95% statistical confidence interval.
          </p>
        </div>
      </Panel>
    </>
  );
}

