import { useState } from "react";
import { Zap, Flame, ShieldAlert, CheckCircle2, Server, Home, Wrench, Power, RefreshCw } from "lucide-react";
import { useStation } from "@/components/station-context";
import { cn } from "@/lib/utils";

export function ScadaDiagram() {
  const { station, telemetry } = useStation();

  // Generator Breaker & Bus Bar State
  const [genA, setGenA] = useState(true);
  const [genB, setGenB] = useState(true);
  const [genCStandby, setGenCStandby] = useState(false);
  const [chpHratActive, setChpHratActive] = useState(true);

  const activeGenCount = (genA ? 1 : 0) + (genB ? 1 : 0) + (genCStandby ? 1 : 0);
  const unitCapacity = station.generatorCapacityKw / 2;
  const availableKw = activeGenCount * unitCapacity;
  const isOverload = telemetry.powerDrawKw > availableKw;

  return (
    <div className="rounded-xl border border-border/80 bg-card/50 p-5 shadow-lg relative overflow-hidden">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              SCADA Single-Line Microgrid Bus Topology ({station.name})
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            415V / 50Hz Primary Bus, Genset Breakers & Combined Heat-and-Power (CHP) Thermal Loops
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Available Capacity:</span>
          <span className={cn("data-num font-bold text-sm", isOverload ? "text-critical" : "text-primary")}>
            {availableKw} kW
          </span>
          <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase", isOverload ? "bg-critical/20 text-critical" : "bg-nominal/20 text-nominal")}>
            {isOverload ? "OVERLOAD WARNING" : "GRID STABLE"}
          </span>
        </div>
      </div>

      {/* Interactive Topology Diagram Workspace */}
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        {/* Left Column: Generation Sources (Gensets) */}
        <div className="space-y-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block border-b border-border/40 pb-1">
            Generation Sources (Diesel/CHP)
          </span>

          {/* Genset A */}
          <div className={cn("rounded-lg border p-3 text-xs transition-all", genA ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30" : "border-border/60 bg-muted/20 opacity-60")}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Genset #1 (CHP)</span>
              <button
                onClick={() => setGenA(!genA)}
                className={cn("rounded p-1 text-[10px] font-bold uppercase border cursor-pointer", genA ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" : "bg-muted text-muted-foreground border-border")}
              >
                {genA ? "ONLINE" : "OFFLINE"}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Output: <strong className="data-num text-foreground">{genA ? Math.round(telemetry.powerDrawKw * 0.52) : 0} kW</strong></span>
              <span>Rating: {unitCapacity} kW</span>
            </div>
          </div>

          {/* Genset B */}
          <div className={cn("rounded-lg border p-3 text-xs transition-all", genB ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30" : "border-border/60 bg-muted/20 opacity-60")}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Genset #2 (CHP)</span>
              <button
                onClick={() => setGenB(!genB)}
                className={cn("rounded p-1 text-[10px] font-bold uppercase border cursor-pointer", genB ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" : "bg-muted text-muted-foreground border-border")}
              >
                {genB ? "ONLINE" : "OFFLINE"}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Output: <strong className="data-num text-foreground">{genB ? Math.round(telemetry.powerDrawKw * 0.48) : 0} kW</strong></span>
              <span>Rating: {unitCapacity} kW</span>
            </div>
          </div>

          {/* Genset C Standby */}
          <div className={cn("rounded-lg border p-3 text-xs transition-all", genCStandby ? "border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30" : "border-border/60 bg-muted/20 opacity-60")}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Genset #3 (Standby)</span>
              <button
                onClick={() => setGenCStandby(!genCStandby)}
                className={cn("rounded p-1 text-[10px] font-bold uppercase border cursor-pointer", genCStandby ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40" : "bg-muted text-muted-foreground border-border")}
              >
                {genCStandby ? "STANDBY ONLINE" : "STANDBY IDLE"}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Output: <strong className="data-num text-foreground">{genCStandby ? 25 : 0} kW</strong></span>
              <span>Rating: {unitCapacity} kW</span>
            </div>
          </div>
        </div>

        {/* Center Bus Bar Column */}
        <div className="lg:col-span-2 flex flex-col justify-between rounded-lg border border-primary/40 bg-primary/5 p-4 relative">
          <div>
            <div className="flex items-center justify-between border-b border-primary/30 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Power className="size-4" /> 415V / 3-Phase Main Bus Bar
              </span>
              <span className="data-num text-xs font-semibold text-foreground">{telemetry.gridFrequencyHz.toFixed(2)} Hz</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded border border-border/70 bg-card/60 p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase">Active Load</span>
                <div className="data-num text-xl font-bold text-foreground mt-0.5">{telemetry.powerDrawKw} kW</div>
              </div>
              <div className="rounded border border-border/70 bg-card/60 p-2.5">
                <span className="text-muted-foreground text-[10px] uppercase">Fuel Flow Rate</span>
                <div className="data-num text-xl font-bold text-primary mt-0.5">{telemetry.flowRateLph} L/h</div>
              </div>
            </div>
          </div>

          {/* CHP Thermal Heat Exchanger Bar */}
          <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-warning flex items-center gap-1.5">
                <Flame className="size-4" /> CHP Exhaust Heat Exchanger
              </span>
              <button
                onClick={() => setChpHratActive(!chpHratActive)}
                className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase border", chpHratActive ? "bg-warning/30 text-warning border-warning/50" : "bg-muted text-muted-foreground")}
              >
                {chpHratActive ? "RECOVERY ACTIVE" : "BYPASSED"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Engine jacket coolant heat is recovered to supply station space heating & hydronic snow melt loops.
            </p>
          </div>
        </div>

        {/* Right Column: End-Use Sub-Circuits */}
        <div className="space-y-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block border-b border-border/40 pb-1">
            End-Use Distribution Circuits
          </span>

          <div className="rounded-lg border border-border/70 bg-card/40 p-2.5 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-warning" />
              <span>Space & Water Heating</span>
            </div>
            <strong className="data-num text-foreground">{Math.round((telemetry.powerDrawKw * station.loadSplit.heating) / 100)} kW</strong>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/40 p-2.5 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-sky-400" />
              <span>Labs & Science Rig</span>
            </div>
            <strong className="data-num text-foreground">{Math.round((telemetry.powerDrawKw * station.loadSplit.labs) / 100)} kW</strong>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/40 p-2.5 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="size-4 text-emerald-400" />
              <span>Living & Kitchen</span>
            </div>
            <strong className="data-num text-foreground">{Math.round((telemetry.powerDrawKw * station.loadSplit.living) / 100)} kW</strong>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/40 p-2.5 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="size-4 text-purple-400" />
              <span>Water Melt & Utilities</span>
            </div>
            <strong className="data-num text-foreground">{Math.round((telemetry.powerDrawKw * station.loadSplit.utilities) / 100)} kW</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
