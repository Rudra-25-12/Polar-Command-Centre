import { createFileRoute } from "@tanstack/react-router";
import { Database, Server, Cpu, CheckCircle2, ShieldCheck } from "lucide-react";
import { PageHeader, Panel, SourceTag } from "@/components/telemetry";
import { STATIONS, STATION_ORDER } from "@/lib/station-data";

export const Route = createFileRoute("/data-sources")({
  head: () => ({
    meta: [
      { title: "Data Sources & Architecture — Polar Station Energy Command" },
      {
        name: "description",
        content: "Telemetry provenance, backend architecture and AI model integration map.",
      },
      { property: "og:title", content: "Data Sources & Architecture — Polar Station Energy Command" },
      { property: "og:description", content: "Provenance and backend connection mapping." },
    ],
  }),
  component: DataSourcesPage,
});

const API_ENDPOINTS = [
  { table: "/consumption, /load-forecast", description: "Zone-wise power draw and Prophet-based demand forecasting" },
  { table: "/fuel, /fuel-forecast", description: "Fuel tank level history and Prophet-based depletion forecast with confidence bands" },
  { table: "/renewables, /dispatch", description: "Real astral-calculated solar + NPDC-calibrated wind, and renewable-first dispatch decision" },
  { table: "/load-shedding-status", description: "Safety-tiered automatic load shedding decision engine" },
  { table: "/equipment-health", description: "Isolation Forest anomaly detection on equipment vibration & temperature" },
  { table: "/savings, /sustainability-report", description: "Diesel/CO2 savings tracking vs. baseline, formatted sustainability report" },
  { table: "/shift-recommendations", description: "Shiftable-load recommendations aligned to renewable surplus windows" },
  { table: "/scenario-simulator, /renewable-expansion-suggestion", description: "What-if renewable capacity modeling" },
  { table: "/hq-summary", description: "Compressed telemetry summary simulating low-bandwidth satellite sync to HQ" },
];

function DataSourcesPage() {
  return (
    <>
      <PageHeader
        title="Data Sources & Architecture"
        subtitle="Telemetry provenance, backend architecture, and real research data grounding"
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Current Integration Status">
          <div className="flex items-center gap-3 rounded-md border border-border/70 bg-card/60 p-3">
            <Database className="size-5 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Backend Connection:</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
                  FastAPI Backend Live Connected
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Live telemetry and AI predictions served by a Python FastAPI backend, polled at intervals appropriate to each data type (5s for live power/climate, 30-60s for AI model outputs).
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <SourceTag source="NCPOR Annual Reports (2013-14 to 2024-25)" />
            <SourceTag source="National Polar Data Center (NPDC)" />
            <SourceTag source="NCPOR/NCAOR Official Station Pages" />
          </div>
        </Panel>

        <Panel title="Backend Architecture (Python FastAPI + SQLite + AI Models)">
          <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">Data Layer —</span>
              <span><strong>SQLite Database:</strong> Stores synthetic sensor readings calibrated against real NCPOR/NPDC data, per station.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">AI Layer —</span>
              <span><strong>Facebook Prophet:</strong> Load and fuel forecasting with confidence intervals. <strong>Isolation Forest (scikit-learn):</strong> Predictive maintenance anomaly detection.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">API Layer —</span>
              <span><strong>FastAPI:</strong> Serves 18 endpoints across load forecasting, renewable integration, and fuel optimization — the three pillars of SIH26061.</span>
            </li>
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4" title="Backend API Endpoint Map" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="px-5 py-3">Endpoint(s)</th>
                <th className="px-5 py-3">Function</th>
                <th className="px-5 py-3">Frontend Consumer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {API_ENDPOINTS.map((t) => (
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

      <Panel className="mt-4" title="Per-Station Baseline Parameters (Real, Cited Research Data)" bodyClassName="p-0">
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