import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  Fuel,
  Gauge,
  Globe,
  Leaf,
  LineChart,
  Moon,
  Snowflake,
  Sun,
  Users,
  Sparkles,
} from "lucide-react";
import { useStation } from "@/components/station-context";
import { STATIONS, STATION_ORDER } from "@/lib/station-data";
import { cn } from "@/lib/utils";
import { FleetModal } from "@/components/fleet-modal";
import { AiCopilotModal } from "@/components/ai-copilot-modal";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/fuel", label: "Fuel & Runway", icon: Fuel },
  { to: "/load", label: "Load Breakdown", icon: BarChart3 },
  { to: "/forecast", label: "Forecast", icon: LineChart },
  { to: "/personnel", label: "Personnel", icon: Users },
  { to: "/environmental", label: "Environmental", icon: Snowflake },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/sustainability", label: "Sustainability", icon: Leaf },
  { to: "/data-sources", label: "Data Sources", icon: Database },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { stationId, station, setStationId, telemetry, isSatMode, toggleSatMode, season, toggleSeason } = useStation();

  const [fleetOpen, setFleetOpen] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);

  // If on the root Landing Page route, render full width without sidebar frame
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <FleetModal open={fleetOpen} onClose={() => setFleetOpen(false)} />
      <AiCopilotModal open={aiCopilotOpen} onClose={() => setAiCopilotOpen(false)} />

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {/* Polished Logo Badge Header */}
        <div className="border-b border-sidebar-border p-4">
          <Link
            to="/"
            className="group block rounded-xl bg-white p-2.5 shadow-sm border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-md transition-all text-center"
            title="Return to Landing Page"
          >
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="Polar Energy Logo"
                width={160}
                height={40}
                loading="eager"
                decoding="async"
                className="h-12 sm:h-14 w-auto object-contain mx-auto transition-transform group-hover:scale-105"
              />
            </picture>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("size-4", active && "text-primary")} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* AI Copilot Quick Button in Sidebar */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <button
            onClick={() => setAiCopilotOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-xs"
          >
            <Sparkles className="size-3.5" />
            <span>AI Station Copilot</span>
          </button>
        </div>

        <div className="border-t border-sidebar-border px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground flex items-center justify-between font-mono">
          <span>NCPOR Telemetry</span>
          <span>v2.4</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5">
            <div className="flex items-center gap-3">
              {/* Station Switcher Segmented Control */}
              <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-card/60 p-1">
                {STATION_ORDER.map((id) => {
                  const s = STATIONS[id];
                  const active = id === stationId;
                  return (
                    <button
                      key={id}
                      onClick={() => setStationId(id)}
                      className={cn(
                        "group relative rounded-lg px-3 py-1.5 text-left transition-all flex items-center gap-2 text-xs font-semibold",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-card/90 hover:text-foreground",
                      )}
                    >
                      <span>{s.name}</span>
                      {s.sharedInfrastructure ? (
                        <span className={cn("rounded px-1.5 py-0.2 text-[9px] font-bold uppercase", active ? "bg-black/20 text-white" : "bg-sky-500/15 text-sky-600")}>
                          Shared Grid
                        </span>
                      ) : (
                        <span className={cn("rounded px-1.5 py-0.2 text-[9px] font-bold uppercase", active ? "bg-black/20 text-white" : "bg-emerald-500/15 text-emerald-600")}>
                          Microgrid
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Telemetry Controls Bar */}
            <div className="flex items-center gap-2 text-xs">
              {/* Season Scrubber Button */}
              <button
                onClick={toggleSeason}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-sm",
                  season === "summer"
                    ? "border-warning/60 bg-amber-50 text-amber-700"
                    : "border-primary/60 bg-emerald-50 text-emerald-700",
                )}
                title="Toggle Station Season: Polar Night (Winter) vs Polar Day (Summer)"
              >
                {season === "summer" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                <span>{season === "summer" ? "Mid-Summer (24h Day)" : "Mid-Winter (Polar Night)"}</span>
              </button>

              {/* HQ Fleet View Button */}
              <button
                onClick={() => setFleetOpen(true)}
                className="rounded-lg border border-border/80 bg-card/60 px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-card transition-colors flex items-center gap-1.5 shadow-sm"
                title="View All 3 Polar Stations HQ Fleet Overview"
              >
                <Globe className="size-3.5 text-primary" />
                <span>NCPOR HQ Fleet</span>
              </button>

              {/* Satellite Link Mode Toggle Button */}
              <button
                onClick={toggleSatMode}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-sm",
                  isSatMode
                    ? "border-sky-500/60 bg-sky-50 text-sky-700"
                    : "border-border/80 bg-card/60 text-muted-foreground hover:text-foreground",
                )}
                title="Toggle Iridium Satellite Bandwidth Optimization"
              >
                <span className={cn("size-2 rounded-full", isSatMode ? "bg-sky-500 live-dot" : "bg-emerald-500 live-dot")} />
                {isSatMode ? "Sat-Link 850B" : "WebSockets"}
              </button>

              <div className="hidden xl:flex items-center gap-2 rounded-lg border border-border/70 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span>Freq:</span>
                  <strong className="data-num font-semibold text-foreground">{telemetry.gridFrequencyHz.toFixed(2)} Hz</strong>
                </span>
                <span className="text-border/80">|</span>
                <span className="data-num font-mono text-foreground">{station.coordinates}</span>
              </div>
            </div>
          </div>
        </header>

        {isSatMode && (
          <div className="bg-sky-50 border-b border-sky-200 px-5 py-2 text-xs text-sky-900 flex items-center justify-between font-medium">
            <span>📡 <strong>Iridium Satellite Low-Bandwidth Mode Active:</strong> Telemetry compressed to 850-byte binary packets sent to NCPOR HQ in Goa every 10 seconds.</span>
            <button onClick={toggleSatMode} className="text-[10px] font-bold uppercase tracking-wider underline text-sky-700 hover:text-sky-900">Switch to Full Stream</button>
          </div>
        )}

        <nav className="flex gap-1 overflow-x-auto border-b border-border/70 px-3 py-2 lg:hidden">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium",
                pathname === to ? "bg-accent text-accent-foreground font-bold" : "text-muted-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
