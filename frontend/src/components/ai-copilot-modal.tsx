import { useState } from "react";
import { Bot, Send, Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Wrench, RefreshCw, X } from "lucide-react";
import { useStation } from "@/components/station-context";
import { cn } from "@/lib/utils";

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

export function AiCopilotModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { station, telemetry, triggerAnomaly, clearAnomaly } = useStation();

  const initialMessage = telemetry.anomalyActive
    ? `⚠️ CRITICAL TELEMETRY SPIKE DETECTED on ${station.name} Microgrid! Power draw spiked by +35% (current: ${telemetry.powerDrawKw} kW). Diagnostic Model analysis suggests high thermal heating demand or mechanical oscillation on Genset B. Recommendation: Execute Tier 1 Load Shedding or switch Genset B loop.`
    : `👋 System Nominal on ${station.name} Station. Current power draw is ${telemetry.powerDrawKw} kW across ${station.headcount} personnel. Fuel runway is stable at ${Math.round(station.fuelRemainingL / station.dailyConsumptionL)} days. How can I assist with microgrid operations today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: initialMessage, timestamp: "Just now" },
  ]);
  const [input, setInput] = useState("");

  if (!open) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");

    const newMsgs: ChatMessage[] = [
      ...messages,
      { sender: "user", text: userMsg, timestamp: "Just now" },
    ];
    setMessages(newMsgs);

    // AI response simulation
    setTimeout(() => {
      let reply = `Analyzed "${userMsg}" against ${station.name} telemetry vectors. System parameters are operating within standard tolerance. Baseline burn is ${station.dailyConsumptionL} L/day.`;
      const q = userMsg.toLowerCase();
      if (q.includes("resupply") || q.includes("delay")) {
        reply = `Vessel delay analysis: A 30-day resupply delay reduces ${station.name}'s safety runway margin. Activating Crisis Multiplier preset 1.25x projects dry tank date by D+${Math.round((station.fuelRemainingL / (station.dailyConsumptionL * 1.25)))}.`;
      } else if (q.includes("heat") || q.includes("solar") || q.includes("wind")) {
        reply = `Renewable dispatch vector: Shifting discretionary snow-melting heating load to peak solar windows (12:00-15:30 UTC) will save approximately 140 Litres of Jet-A1/diesel per day.`;
      } else if (q.includes("spike") || q.includes("anomaly") || q.includes("error")) {
        reply = `Microgrid Anomaly Engine: Isolation Forest anomaly detector monitors 6 sensor channels. Triggering load shedding reduces genset thermal wear by 18%.`;
      }

      setMessages((prev) => [...prev, { sender: "ai", text: reply, timestamp: "Just now" }]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-xl border border-primary/40 bg-background/95 p-6 shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-primary/50 bg-primary/20 text-primary">
              <Bot className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-foreground">
                  Polar Sentinel AI — Station Copilot
                </h2>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Prophet + SCADA Copilot
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Active telemetry context: <strong className="text-foreground">{station.name} Station</strong> ({telemetry.powerDrawKw} kW draw)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-border/70 bg-card/50 p-1.5 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Diagnostic Action Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/40 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-primary" />
            <span>Telemetry Health Status:</span>
            <span className={cn("font-semibold", telemetry.anomalyActive ? "text-critical" : "text-nominal")}>
              {telemetry.anomalyActive ? "⚠️ Critical Anomaly Active" : "✔ All Systems Nominal"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {telemetry.anomalyActive ? (
              <button
                onClick={clearAnomaly}
                className="rounded border border-nominal/50 bg-nominal/20 px-2.5 py-1 text-[11px] font-semibold text-nominal hover:bg-nominal/30 transition-colors"
              >
                Reset Anomaly State
              </button>
            ) : (
              <button
                onClick={triggerAnomaly}
                className="rounded border border-critical/50 bg-critical/20 px-2.5 py-1 text-[11px] font-semibold text-critical hover:bg-critical/30 transition-colors"
              >
                Simulate Anomaly Spike (+35%)
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages Log */}
        <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={cn("flex gap-3 text-xs leading-relaxed", m.sender === "user" ? "justify-end" : "justify-start")}
            >
              {m.sender === "ai" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary mt-0.5">
                  <Sparkles className="size-3.5" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[82%] rounded-xl px-4 py-3 border",
                  m.sender === "user"
                    ? "border-primary/50 bg-primary/20 text-foreground rounded-tr-none"
                    : "border-border/70 bg-card/60 text-foreground/90 rounded-tl-none",
                )}
              >
                <p>{m.text}</p>
                <span className="mt-1 block text-[9px] text-muted-foreground text-right">{m.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Copilot about resupply delays, solar dispatch, or genset anomalies..."
            className="flex-1 rounded-lg border border-border/70 bg-card/60 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <span>Ask AI</span>
            <Send className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
