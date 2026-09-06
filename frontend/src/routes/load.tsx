import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, Zap, Server, Home, Wrench, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { useStation } from "@/components/station-context";
import { PageHeader, Panel, StatCard, SourceTag } from "@/components/telemetry";
import { loadBreakdownSeries } from "@/lib/station-data";
import { axisProps, chartTooltip } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";
import { ScadaDiagram } from "@/components/scada-diagram";

export const Route = createFileRoute("/load")({
  head: () => ({
    meta: [
      { title: "Load Breakdown — Polar Station Energy Command" },
      {
        name: "description",
        content: "How station generation splits across heating, labs, living quarters and utilities.",
      },
      { property: "og:title", content: "Load Breakdown — Polar Station Energy Command" },
      {
        property: "og:description",
        content: "Stacked load split across heating, labs, living quarters and utilities.",
      },
    ],
  }),
  component: LoadPage,
});

const KEYS = [
  { key: "heating", label: "Space & Water Heating", icon: Flame, color: "var(--chart-3)", zone: "Heating" },
  { key: "labs", label: "Scientific Labs & Instrumentation", icon: Server, color: "var(--chart-1)", zone: "Labs" },
  { key: "living", label: "Living Quarters & Kitchen", icon: Home, color: "var(--chart-5)", zone: "Dorms" },
  { key: "utilities", label: "Water Melt & Life Support Utilities", icon: Wrench, color: "var(--chart-2)", zone: "Kitchen" },
];

function LoadPage() {
  const { station, telemetry, loadInfo } = useStation();
  const data = useMemo(() => loadBreakdownSeries(station), [station.id]);

  const zoneKw = (zone: string) => {
    const found = loadInfo?.zoneBreakdown.find((z) => z.zone === zone);
    return found ? found.kw : 0;
  };

  const totalRealKw = loadInfo?.zoneBreakdown.reduce((sum, z) => sum + z.kw, 0) ?? telemetry.powerDrawKw;

  const shedding = loadInfo?.shedding;
  const shiftRec = loadInfo?.shiftRecommendation;

  return (
    <>
      <PageHeader
        title={`${station.name} — Load Breakdown & Microgrid Controls`}
        subtitle="Generation → end-use distribution, AI-driven load shedding & shiftable load optimization"
      />

      <div className="mb-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs leading-relaxed text-amber-950 dark:text-amber-100 shadow-xs">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
          <Flame className="size-4 text-amber-600 dark:text-amber-400" />
          <span>Thermal & Electrical Coupling Warning</span>
        </div>
        <p className="mt-1.5 text-amber-900/90 dark:text-amber-200/90 font-medium">
          Space heating and water melting draw directly from the primary station fuel pool via combined heat-and-power (CHP) coolant loops and supplementary hydronic boilers. Increasing indoor heating during polar blizzards accelerates overall tank depletion at the exact same rate as electrical load spikes.
        </p>
      </div>

      <div className="mb-4">
        <ScadaDiagram />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KEYS.map(({ key, label, icon: Icon, zone }) => {
          const kw = zoneKw(zone);
          const pct = totalRealKw > 0 ? Math.round((kw / totalRealKw) * 100) : 0;
          return (
            <StatCard
              key={key}
              label={label}
              value={String(pct)}
              unit="% of load"
              icon={Icon}
              hint={`${kw.toFixed(1)} kW active load`}
              source="Real Sensor Feed"
            />
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="AI-Driven Load Shedding Status"
          description="Automatic safety-tiered shedding decision based on current supply vs demand."
          source="Load Shedding Engine"
        >
          {shedding ? (
            <div
              className={cn(
                "rounded-lg border p-4 text-xs leading-relaxed",
                shedding.required
                  ? "border-amber-400 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100"
                  : "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100",
              )}
            >
              <div className="flex items-center gap-2 font-semibold">
                {shedding.required ? <ShieldAlert className="size-4" /> : <CheckCircle2 className="size-4" />}
                <span>{shedding.required ? "Shedding Active" : "Supply Meets Demand"}</span>
              </div>
              <p className="mt-2">{shedding.message}</p>
              {shedding.shedZones.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {shedding.shedZones.map((z: any, i: number) => (
                    <li key={i} className="flex items-center justify-between border-t border-current/10 pt-1.5">
                      <span className="font-medium">{z.zone}</span>
                      <span className="rounded bg-current/10 px-1.5 py-0.5 text-[10px] font-bold uppercase">{z.tier_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Loading load-shedding status...</p>
          )}
        </Panel>

        <Panel
          title="Shiftable-Load & Renewable Dispatch Optimizer"
          description="AI recommendations to align discretionary thermal/water load with peak renewable availability."
          source="Shiftable Load Engine"
        >
          {shiftRec ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-xs leading-relaxed">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <Clock className="size-4" />
                <span>Discretionary Load Shift Recommendation</span>
              </div>
              <p className="mt-2 text-muted-foreground">
                <strong className="text-foreground">{shiftRec.zone}</strong> can be shifted: {shiftRec.reason}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-primary/20 pt-2 text-[11px]">
                <span>Available Surplus: <strong className="data-num text-nominal">{shiftRec.surplusKw.toFixed(1)} kW</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No shiftable-load surplus window currently available.</p>
          )}
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Stacked Load Profile (24 Hours)"
        description="Continuous 24-hour power split by category across station microgrid circuits."
        source="SCADA Power Metering"
      >
        <div className="h-[380px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" {...axisProps} interval={3} />
              <YAxis {...axisProps} unit=" kW" />
              <RTooltip {...chartTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {KEYS.map(({ key, label, color }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stackId="1"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}