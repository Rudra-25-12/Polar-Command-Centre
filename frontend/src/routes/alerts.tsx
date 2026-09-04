import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, AlertOctagon, BellRing, Zap } from "lucide-react";
import { useStation } from "@/components/station-context";
import { PageHeader, Panel, SeverityBadge, SourceTag } from "@/components/telemetry";
import { alertsFor, type Severity } from "@/lib/station-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Polar Station Energy Command" },
      {
        name: "description",
        content: "Anomaly and predictive-maintenance notifications: fuel, generators, personnel and sensors.",
      },
      { property: "og:title", content: "Alerts — Polar Station Energy Command" },
      { property: "og:description", content: "Severity-ranked anomaly feed for the selected polar station." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { station, telemetry, triggerAnomaly, clearAnomaly } = useStation();
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [acknowledged, setAcknowledged] = useState<string[]>([]);

  const rawAlerts = alertsFor(station);
  if (telemetry.anomalyActive) {
    rawAlerts.unshift({
      id: `${station.id}-surge`,
      title: "Critical Microgrid Thermal Spike",
      detail: "35% unexpected power demand jump detected across microgrid heaters.",
      severity: "critical",
      timestamp: "Just now",
      source: "SCADA Telemetry Array",
    });
  }

  const alerts = rawAlerts
    .filter((a) => filter === "all" || a.severity === filter)
    .sort((a, b) =>
      a.severity === b.severity
        ? 0
        : a.severity === "critical"
          ? -1
          : b.severity === "critical"
            ? 1
            : a.severity === "warning"
              ? -1
              : 1,
    );

  const toggleAck = (id: string) => {
    setAcknowledged((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <>
      <PageHeader title={`${station.name} — Alerts & Anomaly Telemetry`} subtitle="Severity-ranked anomaly detection & predictive maintenance feed" />

      {/* Trigger Anomaly Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/40 p-4">
        <div className="flex items-center gap-2 text-xs">
          <BellRing className="size-4 text-primary" />
          <span>Interactive Anomaly Test:</span>
          <span className="text-muted-foreground">Test system response to sudden polar thermal surges.</span>
        </div>
        <div className="flex items-center gap-2">
          {telemetry.anomalyActive ? (
            <button
              onClick={clearAnomaly}
              className="rounded-md border border-nominal/50 bg-nominal/15 px-3 py-1.5 text-xs font-semibold text-nominal transition-colors hover:bg-nominal/25"
            >
              Reset Telemetry to Nominal
            </button>
          ) : (
            <button
              onClick={triggerAnomaly}
              className="rounded-md border border-critical/50 bg-critical/15 px-3 py-1.5 text-xs font-semibold text-critical transition-colors hover:bg-critical/25"
            >
              Trigger Load Surge (+35%)
            </button>
          )}
        </div>
      </div>

      <Panel
        title="Active Telemetry Feed"
        source="SCADA Telemetry Array"
        bodyClassName="p-0"
        action={
          <div className="flex flex-wrap gap-1.5">
            {(["all", "critical", "warning", "nominal"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors",
                  filter === f
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      >
        <ul className="divide-y divide-border/60">
          {alerts.length === 0 ? (
            <li className="p-8 text-center text-xs text-muted-foreground">No alerts match the selected severity filter.</li>
          ) : (
            alerts.map((a) => {
              const isAck = acknowledged.includes(a.id);
              return (
                <li
                  key={a.id}
                  className={cn(
                    "flex flex-wrap items-start justify-between gap-4 px-5 py-4 transition-colors",
                    isAck && "opacity-45 bg-muted/10",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <SeverityBadge severity={a.severity} />
                      <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                      {isAck && (
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{a.detail}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="data-num text-xs text-muted-foreground">{a.timestamp}</span>
                    <div className="flex items-center gap-2">
                      <SourceTag source={a.source} />
                      <button
                        onClick={() => toggleAck(a.id)}
                        className="rounded border border-border/80 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-border hover:text-foreground transition-colors"
                      >
                        {isAck ? "Unack" : "Acknowledge"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </Panel>
    </>
  );
}

