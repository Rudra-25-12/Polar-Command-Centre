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
  { key: "heating", label: "Space & Water Heating", icon: Flame, color: "var(--chart-3)" },
  { key: "labs", label: "Scientific Labs & Instrumentation", icon: Server, color: "var(--chart-1)" },
  { key: "living", label: "Living Quarters & Kitchen", icon: Home, color: "var(--chart-5)" },
  { key: "utilities", label: "Water Melt & Life Support Utilities", icon: Wrench, color: "var(--chart-2)" },
];

interface ShedTier {
  id: string;
  tier: string;
  name: string;
  kwReduction: number;
  fuelSavedPerDay: number;
  category: string;
  risk: "Low Risk" | "Medium Risk" | "High Risk";
}

const LOAD_SHED_TIERS: ShedTier[] = [
  {
    id: "tier-1",
    tier: "Tier 1 (Non-Essential)",
    name: "Non-critical deep ice core sample incubator standby",
    kwReduction: 15,
    fuelSavedPerDay: 60,
    category: "Labs",
    risk: "Low Risk",
  },
  {
    id: "tier-2",
    tier: "Tier 2 (Auxiliary)",
    name: "Secondary snow melt tank & laundry sub-circuit",
    kwReduction: 12,
    fuelSavedPerDay: 48,
    category: "Utilities",
    risk: "Medium Risk",
  },
  {
    id: "tier-3",
    tier: "Tier 3 (Emergency)",
    name: "Common corridor hydronic heating reduction (-3°C offset)",
    kwReduction: 22,
    fuelSavedPerDay: 88,
    category: "Heating",
    risk: "High Risk",
  },
];

function LoadPage() {
  const { station, telemetry } = useStation();
  const data = useMemo(() => loadBreakdownSeries(station), [station.id]);

  // Operator-gated load shedding state
  const [approvedTiers, setApprovedTiers] = useState<string[]>([]);
  const [shiftApplied, setShiftApplied] = useState(false);

  // Reset load shedding controls on station switch
  useEffect(() => {
    setApprovedTiers([]);
    setShiftApplied(false);
  }, [station.id]);

  const toggleTier = (id: string) => {
    setApprovedTiers((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const totalShedKw = LOAD_SHED_TIERS.filter((t) => approvedTiers.includes(t.id)).reduce(
    (a, b) => a + b.kwReduction,
    0,
  );
  const totalFuelSaved = LOAD_SHED_TIERS.filter((t) => approvedTiers.includes(t.id)).reduce(
    (a, b) => a + b.fuelSavedPerDay,
    0,
  );

  return (
    <>
      <PageHeader
        title={`${station.name} — Load Breakdown & Microgrid Controls`}
        subtitle="Generation → end-use distribution, human-approved load shedding & shiftable load optimization"
      />

      {/* Critical Thermal Note Banner */}
      <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200 backdrop-blur">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-amber-400">
          <Flame className="size-4" />
          <span>Thermal & Electrical Coupling Warning</span>
        </div>
        <p className="mt-1 text-amber-200/80 leading-relaxed">
          Space heating and water melting draw directly from the primary station fuel pool via combined heat-and-power (CHP) coolant loops and supplementary hydronic boilers. Increasing indoor heating during polar blizzards accelerates overall tank depletion at the exact same rate as electrical load spikes.
        </p>
      </div>

      {/* SCADA Single-Line Microgrid Bus Topology Diagram */}
      <div className="mb-4">
        <ScadaDiagram />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KEYS.map(({ key, label, icon: Icon, color }) => {
          const pct = station.loadSplit[key as keyof typeof station.loadSplit];
          const kw = Math.max(0, Math.round((telemetry.powerDrawKw * pct) / 100));
          return (
            <StatCard
              key={key}
              label={label}
              value={String(pct)}
              unit="% of load"
              hint={`Current draw ≈ ${kw} kW`}
              source="Sub-Metering Array"
            >
              <div className="mt-3 flex items-center justify-between">
                <Icon className="size-4 text-muted-foreground" />
                <span className="data-num text-xs font-semibold text-foreground">{kw} kW</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted/40">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
              </div>
            </StatCard>
          );
        })}
      </div>

      {/* SIH Differentiator Section: Safety-Tiered Load Shedding & Shiftable Load Recommendations */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {/* Safety-Tiered Load Shedding Controller */}
        <Panel
          title="Safety-Tiered Load Shedding Controller"
          description="Human-in-the-loop approval workflow for emergency load reduction under critical fuel windows."
          source="SCADA Interlock Controller"
        >
          <div className="space-y-3">
            {LOAD_SHED_TIERS.map((t) => {
              const isApproved = approvedTiers.includes(t.id);
              return (
                <div
                  key={t.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 transition-all text-xs",
                    isApproved
                      ? "border-amber-500/50 bg-amber-950/20 text-amber-100"
                      : "border-border/70 bg-card/40 text-muted-foreground hover:border-border",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", isApproved ? "bg-amber-500 text-black" : "bg-muted text-foreground")}>
                        {t.tier}
                      </span>
                      <span className="text-foreground">{t.name}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px]">
                      <span>Reduction: <strong className="data-num text-primary">-{t.kwReduction} kW</strong></span>
                      <span>Fuel saved: <strong className="data-num text-nominal">+{t.fuelSavedPerDay} L/day</strong></span>
                      <span className={cn(t.risk === "Low Risk" ? "text-emerald-400" : t.risk === "Medium Risk" ? "text-amber-400" : "text-rose-400")}>
                        {t.risk}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleTier(t.id)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-semibold transition-all",
                      isApproved
                        ? "border-amber-400 bg-amber-500/20 text-amber-300"
                        : "border-border/80 bg-muted/30 text-foreground hover:bg-muted/60",
                    )}
                  >
                    {isApproved ? "Approved (Shedding Active)" : "Approve Shed"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span>Approved Load Reduction:</span>
            <span className="data-num font-semibold text-primary">-{totalShedKw} kW ({totalFuelSaved} L/day saved)</span>
          </div>
        </Panel>

        {/* Shiftable-Load & Renewable Dispatch Optimizer */}
        <Panel
          title="Shiftable-Load & Renewable Dispatch Optimizer"
          description="AI recommendations to align discretionary thermal/water load with peak renewable availability."
          source="Modelled projection"
        >
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-xs leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Clock className="size-4" />
              <span>Discretionary Load Shift Window</span>
            </div>
            <p className="mt-2 text-muted-foreground">
              Station thermal sensors predict a peak solar radiation window between <strong className="text-foreground">12:00 UTC and 15:30 UTC</strong>. Shifting bulk snow-melt tank heating to this window will displace engine generator load.
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-primary/20 pt-2 text-[11px]">
              <span>Estimated Diesel Saved: <strong className="data-num text-nominal">+140 Litres / cycle</strong></span>
              <span>Grid Impact: <strong className="data-num text-sky-400">-18% Peak Demand</strong></span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status: {shiftApplied ? "Shift Schedule Active in SCADA" : "Manual Approval Required"}</span>
            <button
              onClick={() => setShiftApplied((prev) => !prev)}
              className={cn(
                "rounded-md border px-3.5 py-1.5 text-xs font-semibold transition-all",
                shiftApplied
                  ? "border-nominal bg-nominal/20 text-nominal"
                  : "border-primary/60 bg-primary/20 text-primary hover:bg-primary/30",
              )}
            >
              {shiftApplied ? "✔ Dispatch Schedule Applied" : "Apply AI Dispatch Schedule"}
            </button>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Stacked Load Profile (24 Hours)"
        description="Continuous 24-hour power split by category across station microgrid circuits."
        source="SCADA Power Metering"
      >
        <div className="h-[380px]">
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


