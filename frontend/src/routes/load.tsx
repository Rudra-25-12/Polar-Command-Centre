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
  const [simulatedDeficit, setSimulatedDeficit] = useState(false);
  const [commanderApproved, setCommanderApproved] = useState(false);
  const [commanderOverridden, setCommanderOverridden] = useState(false);
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
          title="Safety-Tiered Load Shedding Engine (Rule-Based Governance)"
          description="Deterministic rule: If supply < demand, turn off Low Priority first. Warn Commander before touching Important items. Never touch Critical."
          source="load_shedding.py (decide_load_shedding)"
          action={
            <button
              onClick={() => {
                setSimulatedDeficit((prev) => !prev);
                setCommanderApproved(false);
                setCommanderOverridden(false);
              }}
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-semibold transition-all cursor-pointer shadow-xs",
                simulatedDeficit
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              {simulatedDeficit ? "Stop Power Drop Simulation" : "Simulate 40% Power Drop"}
            </button>
          }
        >
          {/* 3 Categories Summary Grid */}
          <div className="grid grid-cols-3 gap-2 text-[11px] mb-3 font-mono">
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2 text-center">
              <span className="font-bold text-emerald-400 block uppercase">Critical</span>
              <span className="text-[9px] text-muted-foreground block mt-0.5">Heating & Medical</span>
              <span className="text-[9px] text-emerald-300 font-semibold block mt-1">Never Auto-Shed</span>
            </div>
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-center">
              <span className="font-bold text-amber-400 block uppercase">Important</span>
              <span className="text-[9px] text-muted-foreground block mt-0.5">Research Equipment</span>
              <span className="text-[9px] text-amber-300 font-semibold block mt-1">Requires Approval</span>
            </div>
            <div className="rounded-md border border-sky-500/40 bg-sky-500/10 p-2 text-center">
              <span className="font-bold text-sky-400 block uppercase">Low Priority</span>
              <span className="text-[9px] text-muted-foreground block mt-0.5">Extra Light / Sauna</span>
              <span className="text-[9px] text-sky-300 font-semibold block mt-1">Shed First</span>
            </div>
          </div>

          {simulatedDeficit ? (
            <div className="space-y-3 rounded-lg border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/20 p-4 text-xs">
              <div className="flex items-center justify-between border-b border-red-200 dark:border-red-800/60 pb-2">
                <div className="flex items-center gap-2 font-bold text-red-700 dark:text-red-300">
                  <ShieldAlert className="size-4 text-red-500 animate-pulse" />
                  <span>POWER DEFICIT ACTIVE (-40% Supply)</span>
                </div>
                <span className="rounded bg-red-100 dark:bg-red-900/60 border border-red-300 px-2 py-0.5 text-[10px] font-mono font-bold text-red-800 dark:text-red-200">
                  Shortfall: {(totalRealKw * 0.4).toFixed(1)} kW
                </span>
              </div>

              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                Supply dropped below demand. <strong>Low Priority items (extra lighting, sauna)</strong> were shut off automatically. Deficit exceeds Low Priority load — <strong>Station Commander warning generated</strong>.
              </p>

              <div className="space-y-2 pt-1 font-mono text-[11px]">
                {/* Critical Category */}
                <div className="flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/40 p-2 text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>CRITICAL: Space Heating, Oxygen Plant & Medical Fridges</span>
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.5 rounded">
                    PROTECTED (100% POWER)
                  </span>
                </div>

                {/* Important Category */}
                <div className={cn(
                  "flex items-center justify-between rounded-md border p-2 transition-all",
                  commanderApproved
                    ? "border-amber-400 bg-amber-200/90 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100"
                    : commanderOverridden
                    ? "border-sky-400 bg-sky-100 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100"
                    : "border-amber-300 bg-amber-100/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
                )}>
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                    <span>IMPORTANT: Research Equipment & Scientific Labs</span>
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded">
                    {commanderApproved ? "COMMANDER APPROVED SHEDDING" : commanderOverridden ? "MANUAL OVERRIDE (GENSET ON)" : "COMMANDER WARNING: AWAITING APPROVAL"}
                  </span>
                </div>

                {/* Low Priority Category */}
                <div className="flex items-center justify-between rounded-md border border-red-300 bg-red-100/80 dark:bg-red-950/40 p-2 text-red-900 dark:text-red-200 opacity-80">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-3.5 text-red-600 dark:text-red-400" />
                    <span>LOW PRIORITY: Extra Lighting, Snow Melter & Sauna</span>
                  </div>
                  <span className="font-bold uppercase tracking-wider text-[10px] bg-red-200 dark:bg-red-900 px-1.5 py-0.5 rounded">
                    AUTOMATICALLY SHUT OFF
                  </span>
                </div>
              </div>

              {/* Station Commander Governance Controls */}
              <div className="mt-3 border-t border-red-200 dark:border-red-800/60 pt-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-semibold uppercase">
                  Station Commander Governance:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCommanderApproved(true);
                      setCommanderOverridden(false);
                    }}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer",
                      commanderApproved
                        ? "bg-amber-600 text-white border border-amber-700"
                        : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                    )}
                  >
                    {commanderApproved ? "✓ Action Approved" : "Approve Action"}
                  </button>
                  <button
                    onClick={() => {
                      setCommanderOverridden(true);
                      setCommanderApproved(false);
                    }}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer",
                      commanderOverridden
                        ? "bg-sky-600 text-white border border-sky-700"
                        : "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/40 hover:bg-sky-500/30"
                    )}
                  >
                    {commanderOverridden ? "⚡ Overridden (Genset Engaged)" : "Manual Override"}
                  </button>
                </div>
              </div>
            </div>
          ) : shedding ? (
            <div
              className={cn(
                "rounded-lg border p-4 text-xs leading-relaxed",
                shedding.required
                  ? "border-amber-400 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100"
                  : "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  {shedding.required ? <ShieldAlert className="size-4" /> : <CheckCircle2 className="size-4" />}
                  <span>{shedding.required ? "Shedding Active" : "Supply Meets Demand"}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Click "Simulate 40% Power Drop" to test</span>
              </div>
              <p className="mt-2">{shedding.message}</p>
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