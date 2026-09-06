import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Leaf, SunMedium, Wind, DollarSign, Download, Printer, BatteryCharging, Sparkles, Sliders, ShieldCheck } from "lucide-react";
import { useStation } from "@/components/station-context";
import { PageHeader, Panel, StatCard } from "@/components/telemetry";
import { fuelCostSeries } from "@/lib/station-data";
import { axisProps, chartTooltip } from "@/lib/chart-theme";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/sustainability")({
  head: () => ({
    meta: [
      { title: "Sustainability Scorecard — Polar Station Energy Command" },
      {
        name: "description",
        content: "CO₂ emitted versus a renewable-assisted scenario, plus multi-year fuel cost trend.",
      },
      { property: "og:title", content: "Sustainability Scorecard — Polar Station Energy Command" },
      { property: "og:description", content: "Emissions, renewable-assist savings and fuel cost trend." },
    ],
  }),
  component: SustainabilityPage,
});

function SustainabilityPage() {
  const { station, savings, renewablePct } = useStation();
  const costs = fuelCostSeries(station);

  const annualDieselL = savings ? (savings.actualDieselL / savings.periodDays) * 365 : station.dailyConsumptionL * 365;
  const annualCo2Tonnes = Math.round((annualDieselL * station.co2PerLitreKg) / 1000);
  const realDieselSavedL = savings ? (savings.savedDieselL / savings.periodDays) * 365 : 0;
  const realCo2AvoidedTonnes = savings ? Math.round(((savings.co2AvoidedKg / savings.periodDays) * 365) / 1000) : 0;

  const [solarKw, setSolarKw] = useState(40);
  const [windTurbines, setWindTurbines] = useState(2);
  const [bessKwh, setBessKwh] = useState(150);

  const solarGenKwh = solarKw * station.daylightHours * 160;
  const windGenKwh = windTurbines * 30 * 2200;
  const bessEfficiencyOffset = (bessKwh / 500) * 0.08;
  const totalRenewableKwh = (solarGenKwh + windGenKwh) * (1 + bessEfficiencyOffset);
  const simulatedDieselSavedL = Math.round(totalRenewableKwh * 0.238);
  const simulatedCo2SavedTonnes = Math.round((simulatedDieselSavedL * station.co2PerLitreKg) / 1000);
  const simulatedCostSavedK = Math.round((simulatedDieselSavedL * station.fuelCostPerLitre) / 1000);

  const compare = [
    { t: "Current Diesel Baseline", co2: annualCo2Tonnes },
    { t: "Configured Renewable Hybrid", co2: Math.max(0, annualCo2Tonnes - simulatedCo2SavedTonnes) },
  ];

  const exportReport = () => {
    const csvContent = [
      ["NCPOR POLAR STATION ENERGY AUDIT REPORT"],
      ["Station Name", station.name],
      ["Region", station.region],
      ["Coordinates", station.coordinates],
      ["Operating Mode", station.operatingMode],
      ["Fuel Type", station.fuelType],
      ["Landed Fuel Cost", `$${station.fuelCostPerLitre}/L`],
      ["Annual Baseline Burn (from AI savings model)", `${Math.round(annualDieselL)} L`],
      ["Annual Baseline CO2 Emissions", `${annualCo2Tonnes} tonnes`],
      ["Real Diesel Saved vs Baseline (backend-calculated)", `${Math.round(realDieselSavedL)} L/yr`],
      ["Real CO2 Avoided (backend-calculated)", `${realCo2AvoidedTonnes} tonnes/yr`],
      ["Simulated Solar PV", `${solarKw} kW`],
      ["Simulated Wind Turbines", `${windTurbines} x 30kW`],
      ["Simulated Battery Storage", `${bessKwh} kWh`],
      ["Simulated Annual Diesel Saved", `${simulatedDieselSavedL} L`],
      ["Potential Additional CO2 Savings", `${simulatedCo2SavedTonnes} tonnes/year`],
      ["Potential Cost Savings", `$${simulatedCostSavedK}k USD/year`],
      ["Audit Timestamp", new Date().toISOString()],
    ]
      .map((e) => e.map((x) => `"${x}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NCPOR_Energy_Audit_${station.id}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <PageHeader
        title={`${station.name} — Sustainability & Renewable Expansion`}
        subtitle="Carbon footprint, multi-year fuel cost exposure and what-if renewable expansion simulator"
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-md border border-border/80 bg-card/60 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-card transition-colors"
          >
            <Printer className="size-4" />
            Print Official PDF Audit
          </button>
          <button
            onClick={exportReport}
            className="inline-flex items-center gap-2 rounded-md border border-primary/60 bg-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm hover:bg-primary/30 transition-colors"
          >
            <Download className="size-4" />
            Export Audit (CSV)
          </button>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="% Renewable Energy Today"
          value={`${renewablePct.toFixed(1)}`}
          unit="%"
          hint={
            station.polarPhase === "polar night"
              ? "Polar night phase (0% solar, wind active)"
              : "Current renewable penetration"
          }
          source="Renewable Dispatch Engine"
        />
        <StatCard label="Annual CO₂ Emissions" value={annualCo2Tonnes.toLocaleString()} unit="tonnes" source="AI Savings Model (backend)" />
        <StatCard
          label="Already Saved vs Baseline"
          value={Math.round(realDieselSavedL).toLocaleString()}
          unit="L/yr"
          hint={`-${realCo2AvoidedTonnes} t CO₂/yr, from real dispatch optimization`}
          source="Renewable Dispatch Engine"
        />
        <StatCard
          label="Annual Fuel Volume"
          value={`${Math.round(annualDieselL / 1000).toLocaleString()}k`}
          unit="Litres"
          source="AI Fuel Forecast"
        />
      </div>

      <Panel
        className="mt-4 border-primary/30 bg-primary/5"
        title="Interactive Renewable Microgrid Expansion Simulator"
        description="Simulate adding Solar PV, Wind Turbines, and Battery Energy Storage Systems (BESS) to calculate additional diesel displacement on top of current real savings."
        source="Modelled projection, applied to real baseline"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-card/50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <SunMedium className="size-4 text-warning" /> Solar PV Capacity
              </span>
              <span className="data-num font-bold text-primary">{solarKw} kW</span>
            </div>
            <Slider className="mt-3" min={0} max={150} step={10} value={[solarKw]} onValueChange={(val) => setSolarKw(val?.[0] ?? 0)} />
            <span className="mt-2 block text-[10px] text-muted-foreground">Est. generation: ~{Math.round(solarGenKwh / 1000)} MWh/yr</span>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Wind className="size-4 text-emerald-400" /> Wind Turbines (30 kW)
              </span>
              <span className="data-num font-bold text-primary">{windTurbines} units</span>
            </div>
            <Slider className="mt-3" min={0} max={4} step={1} value={[windTurbines]} onValueChange={(val) => setWindTurbines(val?.[0] ?? 0)} />
            <span className="mt-2 block text-[10px] text-muted-foreground">Est. generation: ~{Math.round(windGenKwh / 1000)} MWh/yr</span>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <BatteryCharging className="size-4 text-sky-400" /> BESS Battery Storage
              </span>
              <span className="data-num font-bold text-primary">{bessKwh} kWh</span>
            </div>
            <Slider className="mt-3" min={0} max={500} step={25} value={[bessKwh]} onValueChange={(val) => setBessKwh(val?.[0] ?? 0)} />
            <span className="mt-2 block text-[10px] text-muted-foreground">Generator load smoothing offset: +{Math.round(bessEfficiencyOffset * 100)}%</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">Additional Diesel Saved:</span>
              <strong className="data-num ml-1 font-semibold text-nominal">+{simulatedDieselSavedL.toLocaleString()} L/yr</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Additional CO₂ Reduced:</span>
              <strong className="data-num ml-1 font-semibold text-nominal">-{simulatedCo2SavedTonnes} tonnes/yr</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Est. Additional Cost Savings:</span>
            <span className="data-num text-sm font-bold text-emerald-400">~${simulatedCostSavedK.toLocaleString()}k USD / year</span>
          </div>
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Annual CO₂: Current Baseline vs Further Renewable Expansion" source="AI Savings Model + Modelled projection">
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compare} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" {...axisProps} />
                <YAxis {...axisProps} unit=" t" />
                <RTooltip {...chartTooltip} />
                <Bar dataKey="co2" name="Annual CO₂ (tonnes)" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <span>Potential Further Savings:</span>
            <span className="data-num font-semibold text-nominal">-{simulatedCo2SavedTonnes.toLocaleString()} tonnes CO₂ / year</span>
          </div>
        </Panel>

        <Panel title="Landed Fuel Cost & Volume Trend (2021–2026)" description="Historical landed cost ($k) and delivered volume (kL) per station." source="Est. from historical delivery data">
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costs} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v: number) => `$${v}k`} />
                <RTooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="cost" name="Landed Cost ($k USD)" stroke="var(--chart-1)" strokeWidth={2} />
                <Line type="monotone" dataKey="litres" name="Delivered Volume (kL)" stroke="var(--chart-5)" strokeDasharray="5 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}