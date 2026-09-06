import { createPortal } from "react-dom";
import { Activity, ShieldCheck, MapPin, Gauge, Fuel, Users, Thermometer, ArrowRight, X } from "lucide-react";
import { useStation } from "@/components/station-context";
import { STATIONS, STATION_ORDER, fuelPercent, runwayDays, severityForRunway } from "@/lib/station-data";
import { cn } from "@/lib/utils";

export function FleetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { stationId, setStationId } = useStation();

  if (!open || typeof document === "undefined") return null;

  const totalFuelL = STATION_ORDER.reduce((acc, id) => acc + STATIONS[id].fuelRemainingL, 0);
  const totalPersonnel = STATION_ORDER.reduce((acc, id) => acc + STATIONS[id].headcount, 0);
  const totalPowerKw = STATION_ORDER.reduce((acc, id) => acc + STATIONS[id].powerDrawKw, 0);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 1. SEPARATE BACKDROP OVERLAY LAYER */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 2. ISOLATED MODAL DIALOG CARD */}
      <div
        className="relative z-10 w-full max-w-5xl rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900"
        style={{ backgroundColor: "#ffffff", opacity: 1, color: "#0f172a" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border/70 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-foreground uppercase">
                NCPOR Headquarters — Polar Fleet Command
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              National Centre for Polar and Ocean Research (Goa, India) · Global Telemetry Overview
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border/70 bg-card/50 p-1.5 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Global Fleet Summary Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border/70 bg-card/40 p-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Polar Personnel</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="data-num text-2xl font-semibold text-foreground">{totalPersonnel}</span>
              <span className="text-xs text-muted-foreground">on station</span>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/40 p-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Reserve Fuel</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="data-num text-2xl font-semibold text-primary">{(totalFuelL / 1000).toFixed(0)}k</span>
              <span className="text-xs text-muted-foreground">Litres</span>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/40 p-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Combined Load</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="data-num text-2xl font-semibold text-foreground">{totalPowerKw}</span>
              <span className="text-xs text-muted-foreground">kW draw</span>
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/40 p-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active Stations</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="data-num text-2xl font-semibold text-nominal">3 / 3</span>
              <span className="text-xs text-nominal">Online</span>
            </div>
          </div>
        </div>

        {/* Station Fleet Grid */}
        <div className="mt-5 grid gap-4 md:grid-cols-3 overflow-y-auto pr-1">
          {STATION_ORDER.map((id) => {
            const s = STATIONS[id];
            const isCurrent = id === stationId;
            const days = runwayDays(s);
            const sev = severityForRunway(days);

            return (
              <div
                key={id}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-4 transition-all relative overflow-hidden",
                  isCurrent
                    ? "border-primary/70 bg-primary/10 shadow-lg glow-ring"
                    : "border-border/70 bg-card/40 hover:border-border hover:bg-card/70",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {s.operatingMode === "seasonal" ? "Arctic Expedition" : "Antarctic Microgrid"}
                    </span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        sev === "nominal"
                          ? "bg-nominal/20 text-nominal border border-nominal/30"
                          : "bg-warning/20 text-warning border border-warning/30",
                      )}
                    >
                      {sev}
                    </span>
                  </div>

                  <h3 className="mt-2 text-xl font-bold text-foreground flex items-center gap-2">
                    {s.name}
                    {isCurrent && <span className="text-[10px] font-normal rounded bg-primary/20 text-primary px-2 py-0.5">Active</span>}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.region}</p>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="size-3 text-primary" /> Coordinates
                      </span>
                      <span className="data-num font-mono text-foreground">{s.coordinates}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Gauge className="size-3 text-sky-400" /> Power Draw
                      </span>
                      <span className="data-num font-semibold text-foreground">{s.powerDrawKw} kW</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Fuel className="size-3 text-amber-400" /> Fuel Runway
                      </span>
                      <span className="data-num font-semibold text-foreground">{Math.round(days)} days</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Thermometer className="size-3 text-emerald-400" /> Outside Temp
                      </span>
                      <span className="data-num font-semibold text-foreground">{s.outsideTempC} °C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="size-3 text-purple-400" /> Headcount
                      </span>
                      <span className="data-num font-semibold text-foreground">{s.headcount} people</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStationId(id);
                    onClose();
                  }}
                  className={cn(
                    "mt-5 w-full flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-all",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-border/80 bg-card/60 text-foreground hover:bg-accent hover:border-border",
                  )}
                >
                  <span>{isCurrent ? "Currently Viewing" : `Switch to ${s.name}`}</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
