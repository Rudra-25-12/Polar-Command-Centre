import { createFileRoute } from "@tanstack/react-router";
import { Database, Server, Cpu, CheckCircle2, ShieldCheck } from "lucide-react";
import { PageHeader, Panel, SourceTag } from "@/components/telemetry";
import { STATIONS, STATION_ORDER } from "@/lib/station-data";
import { isSupabaseConnected } from "@/lib/supabase";

export const Route = createFileRoute("/data-sources")({
  head: () => ({
    meta: [
      { title: "Data Sources & Architecture — Polar Station Energy Command" },
      {
        name: "description",
        content: "Telemetry provenance, Supabase database schema and Python forecasting integration map.",
      },
      { property: "og:title", content: "Data Sources & Architecture — Polar Station Energy Command" },
      { property: "og:description", content: "Provenance and backend connection mapping." },
    ],
  }),
  component: DataSourcesPage,
});

const SUPABASE_TABLES = [
  { table: "stations", description: "Station config, mode, coordinates, berth capacity & baseline metrics" },
  { table: "fuel_readings", description: "Time-series tank level (L), capacity, and instantaneous flow rate (L/h)" },
  { table: "power_readings", description: "Generation (kW) & end-use load split (Heating, Labs, Living, Utilities)" },
  { table: "personnel_logs", description: "Station headcount, expedition roles, typical seasonal range & berth ceilings" },
  { table: "environmental_readings", description: "Solar radiation (W/m²), wind speed (m/s), outside temperature (°C)" },
  { table: "forecasts", description: "AI Prophet model 90-day depletion projections and 95% confidence bands" },
  { table: "alerts", description: "Severity-ranked anomaly notifications, sensor dropouts & maintenance logs" },
];

function DataSourcesPage() {
  return (
    <>
      <PageHeader
        title="Data Sources & Architecture"
        subtitle="Telemetry provenance, database schema mapping, and Supabase / Python backend connection roadmap"
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Current Integration Status">
          <div className="flex items-center gap-3 rounded-md border border-border/70 bg-card/60 p-3">
            <Database className="size-5 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Backend Connection:</span>
                {isSupabaseConnected ? (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
                    Supabase Live Connected
                  </span>
                ) : (
                  <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-300">
                    Local SCADA Node Active
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {isSupabaseConnected
                  ? "Streaming live telemetry from Supabase Postgres & Realtime WebSockets."
                  : "Telemetry values served via high-frequency local SCADA node pipeline, ready for instant sync with Supabase JS client."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <SourceTag source="SCADA Bus Node" />
            <SourceTag source="NPDC Telemetry Archive" />
            <SourceTag source="AWS Weather Array" />
            <SourceTag source="NCPOR Logistics Manifest" />
          </div>
        </Panel>

        <Panel title="Architecture Roadmap (Supabase + Python FastAPI + Prophet)">
          <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">Step 1 —</span>
              <span><strong>Supabase Database:</strong> Single source of truth. Stores telemetry readings and AI predictions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">Step 2 —</span>
              <span><strong>Python FastAPI Microservice:</strong> Generates sensor telemetry & runs Prophet model for 90-day depletion curves.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">Step 3 —</span>
              <span><strong>Supabase Realtime:</strong> WebSockets push newly inserted readings to frontend components without polling.</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4" title="Supabase Database Schema Map" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="px-5 py-3">Table Name</th>
                <th className="px-5 py-3">Schema & Fields</th>
                <th className="px-5 py-3">Frontend Consumer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {SUPABASE_TABLES.map((t) => (
                <tr key={t.table}>
                  <td className="data-num px-5 py-3 font-semibold text-primary">{t.table}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{t.description}</td>
                  <td className="px-5 py-3 text-xs">
                    <span className="rounded border border-border/70 bg-card/60 px-2 py-0.5 font-mono text-[10px] text-foreground">
                      useStation() Hook
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-4" title="Per-Station Baseline Parameters" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="px-5 py-3">Station</th>
                <th className="px-5 py-3">Operating Mode</th>
                <th className="px-5 py-3">Fuel Type</th>
                <th className="px-5 py-3">Baseline Burn</th>
                <th className="px-5 py-3">Architectural Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {STATION_ORDER.map((id) => {
                const s = STATIONS[id];
                return (
                  <tr key={id}>
                    <td className="px-5 py-3 font-semibold text-foreground">{s.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.operatingMode}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.fuelType}</td>
                    <td className="data-num px-5 py-3">{s.dailyConsumptionL.toLocaleString()} L/day</td>
                    <td className="max-w-md px-5 py-3 text-xs text-muted-foreground">{s.summary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

