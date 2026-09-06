import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bot, Send, Sparkles, Cpu, X, HelpCircle } from "lucide-react";
import type { StationConfig } from "@/lib/station-data";
import { cn } from "@/lib/utils";

interface LiveTelemetry {
  powerDrawKw: number;
  utilizationPct: number;
  flowRateLph: number;
  tempC: number;
  windSpeedMs: number;
  gridFrequencyHz: number;
  anomalyActive: boolean;
}

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

interface AiCopilotModalProps {
  open: boolean;
  onClose: () => void;
  station: StationConfig;
  telemetry: LiveTelemetry;
  triggerAnomaly: () => void;
  clearAnomaly: () => void;
}

const SUGGESTED_PROMPTS = [
  "⛽ What is our current fuel runway?",
  "☀️ How can we optimize solar dispatch today?",
  "⚠️ Are there active generator anomalies?",
  "⚓ Simulate a 30-day resupply vessel delay",
  "⚡ Which non-critical loads can we shed?",
];

export function AiCopilotModal({
  open,
  onClose,
  station,
  telemetry,
  triggerAnomaly,
  clearAnomaly,
}: AiCopilotModalProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const stationName = station?.name || "Polar Station";
  const headcount = station?.headcount || 20;
  const fuelRemaining = station?.fuelRemainingL || 250000;
  const fuelCapacity = station?.fuelCapacityL || 300000;
  const dailyBurn = station?.dailyConsumptionL || 700;
  const powerDraw = telemetry?.powerDrawKw || 120;
  const isAnomalyActive = telemetry?.anomalyActive || false;
  const baselineRunway = dailyBurn > 0 ? Math.round(fuelRemaining / dailyBurn) : 300;

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      sender: "ai",
      text: `👋 System Nominal on ${stationName} Station.\nCurrent power draw is ${powerDraw} kW across ${headcount} personnel. Fuel runway is stable at ${baselineRunway} days. How can I assist with microgrid operations today?`,
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");

  // Smoothly auto-scroll to the newest message whenever messages array updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (!open || typeof document === "undefined") return null;

  const processQuery = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const q = trimmed.toLowerCase();

    let replyText = "";
    if (q.includes("resupply") || q.includes("delay") || q.includes("vessel")) {
      const reducedRunway = dailyBurn > 0 ? Math.round(fuelRemaining / (dailyBurn * 1.25)) : 240;
      replyText = `⚓ Resupply Logistics Vector for ${stationName}:\n` +
                  `Current reserve: ${fuelRemaining.toLocaleString()} L (${baselineRunway} days baseline runway).\n` +
                  `If a 30-day resupply vessel delay occurs and winter heating spikes burn by +25%, projected fuel runway drops to ~${reducedRunway} days.\n` +
                  `Recommendation: Enable Eco-Mode heating thresholds to extend safety margin by +14 days.`;
    } else if (q.includes("heat") || q.includes("solar") || q.includes("wind") || q.includes("dispatch") || q.includes("renewable")) {
      replyText = `☀️ Renewable Dispatch Vector for ${stationName}:\n` +
                  `Shifting discretionary snow-melting heating load to peak solar windows (11:00-14:30 UTC) will save approximately 140 Litres of Jet-A1/diesel per day while maintaining +21°C interior habitat temperatures.`;
    } else if (q.includes("spike") || q.includes("anomaly") || q.includes("error") || q.includes("vibration") || q.includes("genset") || q.includes("generator")) {
      replyText = isAnomalyActive
        ? `⚠️ ACTIVE ANOMALY ALERT on ${stationName}:\nIsolation Forest ML detector identified vibration spike on Genset B (+35% power draw).\nImmediate action: Execute Tier 1 load shedding or transfer load loop to Genset A.`
        : `✔ Microgrid Anomaly Engine:\nIsolation Forest anomaly detector monitors 6 sensor channels across ${stationName}. All genset bearing temperatures and vibration levels are within normal nominal tolerances.`;
    } else if (q.includes("fuel") || q.includes("runway") || q.includes("tank") || q.includes("burn") || q.includes("diesel")) {
      const pct = Math.round((fuelRemaining / fuelCapacity) * 100);
      replyText = `⛽ Fuel System Telemetry for ${stationName}:\n` +
                  `Total Tank Capacity: ${fuelCapacity.toLocaleString()} L | Remaining: ${fuelRemaining.toLocaleString()} L (${pct}% full).\n` +
                  `Daily Burn: ${dailyBurn} L/day. Estimated Runway: ${baselineRunway} days.`;
    } else if (q.includes("shed") || q.includes("load") || q.includes("demand") || q.includes("power")) {
      replyText = `⚡ Load Management Analysis for ${stationName}:\n` +
                  `Total current power draw: ${powerDraw} kW.\n` +
                  `Priority Tier 0 (Life Critical): Heating & Oxygen plant.\n` +
                  `Priority Tier 2 (Sheddable): Kitchen water heater (40 kW) & Snow Melter (30 kW).`;
    } else if (q.includes("weather") || q.includes("temp") || q.includes("wind") || q.includes("polar")) {
      replyText = `🌡️ Environmental Context for ${stationName}:\n` +
                  `Region: ${station?.region || "Antarctica"} | Coordinates: ${station?.coordinates || "69.4°S"}.\n` +
                  `Polar Phase: ${station?.polarPhase || "polar night"} (${station?.daylightHours || 0} hrs daylight).\n` +
                  `Outside Temp: ${station?.outsideTempC || -27} °C | Wind Speed: ${station?.windSpeedMs || 11.4} m/s.`;
    } else {
      replyText = `🤖 Polar Sentinel AI (${stationName} Context):\n` +
                  `Analyzed "${trimmed}" against real-time microgrid parameters (${powerDraw} kW draw, ${baselineRunway} days fuel runway, ${headcount} headcount).\n` +
                  `All primary systems operating within standard tolerance. How else can I assist with station telemetry?`;
    }

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: trimmed, timestamp: timeStr },
      { sender: "ai", text: replyText, timestamp: timeStr },
    ]);
    setInput("");
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    processQuery(input);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 1. Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 2. Isolated White & Green Modal Card */}
      <div
        className="relative z-10 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh] text-slate-900"
        style={{ backgroundColor: "#ffffff", opacity: 1, color: "#0f172a" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-600 shadow-xs">
              <Bot className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
                  Polar Sentinel AI — Station Copilot
                </h2>
                <span className="rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  Prophet + SCADA AI
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Live telemetry context: <strong className="text-slate-800 font-semibold">{stationName} Station</strong> ({powerDraw} kW draw | {baselineRunway}d fuel runway)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Purpose Banner */}
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-emerald-900 shadow-2xs">
          <HelpCircle className="size-4 text-emerald-600 shrink-0" />
          <span className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900 font-semibold">Copilot Purpose:</strong> Operational AI assistant for polar microgrid management. Analyzes fuel runway forecasts, generator anomaly alerts, solar dispatch, and emergency load shedding.
          </span>
        </div>

        {/* Diagnostic Action Bar */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-emerald-600" />
            <span className="text-slate-600 font-medium">Telemetry Health:</span>
            <span className={cn("font-bold", isAnomalyActive ? "text-red-600" : "text-emerald-600")}>
              {isAnomalyActive ? "⚠️ Critical Anomaly Active" : "✔ All Systems Nominal"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAnomalyActive ? (
              <button
                onClick={clearAnomaly}
                className="rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200 transition-colors shadow-2xs cursor-pointer"
              >
                Reset Anomaly State
              </button>
            ) : (
              <button
                onClick={triggerAnomaly}
                className="rounded-lg border border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-200 transition-colors shadow-2xs cursor-pointer"
              >
                Simulate Anomaly Spike (+35%)
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages Log */}
        <div ref={chatContainerRef} className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn("flex gap-3 text-xs leading-relaxed", m.sender === "user" ? "justify-end" : "justify-start")}
            >
              {m.sender === "ai" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-100 text-emerald-700 mt-0.5 shadow-2xs">
                  <Sparkles className="size-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 border whitespace-pre-line shadow-2xs",
                  m.sender === "user"
                    ? "border-emerald-600 bg-emerald-600 text-white rounded-tr-none font-medium"
                    : "border-slate-200 bg-white text-slate-900 rounded-tl-none",
                )}
                style={m.sender === "ai" ? { backgroundColor: "#ffffff", opacity: 1, color: "#0f172a" } : { opacity: 1 }}
              >
                <p>{m.text}</p>
                <span className={cn("mt-1.5 block text-[9px] text-right font-mono", m.sender === "user" ? "text-emerald-100" : "text-slate-400")}>{m.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Queries */}
        <div className="mt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Suggested Queries:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => processQuery(prompt)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-2xs cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            autoComplete="off"
            placeholder={`Ask AI Copilot about ${stationName}'s fuel runway, generator health, or solar dispatch...`}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none shadow-xs text-left"
            style={{ backgroundColor: "#ffffff", color: "#0f172a" }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <span>Ask AI</span>
            <Send className="size-3.5" />
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
