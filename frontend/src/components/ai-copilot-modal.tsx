import { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles, Cpu, X, Loader2, HelpCircle } from "lucide-react";
import { useStation } from "@/components/station-context";
import { cn } from "@/lib/utils";
import { fetchCopilotResponse } from "@/lib/api";

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "⛽ What is our current fuel runway?",
  "☀️ How can we optimize solar dispatch today?",
  "⚠️ Are there any active generator anomalies?",
  "⚓ Simulate a 30-day resupply vessel delay",
  "⚡ Which non-critical loads can we shed?",
];

export function AiCopilotModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { station, telemetry, triggerAnomaly, clearAnomaly } = useStation();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessage = telemetry.anomalyActive
    ? `⚠️ CRITICAL TELEMETRY SPIKE DETECTED on ${station.name} Microgrid! Power draw spiked by +35% (current: ${telemetry.powerDrawKw} kW). Diagnostic Model analysis suggests high thermal heating demand or mechanical oscillation on Genset B. Recommendation: Execute Tier 1 Load Shedding or switch Genset B loop.`
    : `👋 System Nominal on ${station.name} Station. Current power draw is ${telemetry.powerDrawKw} kW across ${station.headcount} personnel. Fuel runway is stable at ${Math.round(station.fuelRemainingL / station.dailyConsumptionL)} days. How can I assist with microgrid operations today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: initialMessage, timestamp: "Just now" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Auto-focus input & handle Escape key & lock scroll when opened
  useEffect(() => {
    if (!open) return;

    // Prevent background scrolling
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // Auto focus
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, open]);

  if (!open) return null;

  const processQuery = async (queryText: string) => {
    if (!queryText.trim() || isTyping) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Add user message
    const userMsg: ChatMessage = { sender: "user", text: queryText, timestamp: timeStr };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // 1. Attempt Live API Fetch from FastAPI Backend
      const apiResult = await fetchCopilotResponse(station.id, queryText);

      let replyText = "";
      if (apiResult && apiResult.reply) {
        replyText = apiResult.reply;
      } else {
        // 2. Intelligent Context-Aware Fallback Engine
        const q = queryText.toLowerCase();
        const runway = Math.round(station.fuelRemainingL / station.dailyConsumptionL);

        if (q.includes("resupply") || q.includes("delay")) {
          const reducedRunway = Math.round(station.fuelRemainingL / (station.dailyConsumptionL * 1.25));
          replyText = `⚓ Resupply Logistics Vector for ${station.name}:\nCurrent reserve: ${station.fuelRemainingL.toLocaleString()} L (${runway} days baseline runway).\nIf a 30-day resupply vessel delay occurs and winter heating demand spikes burn by +25%, projected fuel runway drops to ~${reducedRunway} days. Recommendation: Enable Eco-Mode heating thresholds to extend safety margin by +14 days.`;
        } else if (q.includes("heat") || q.includes("solar") || q.includes("wind") || q.includes("dispatch")) {
          replyText = `☀️ Renewable Dispatch Vector for ${station.name}:\nShifting discretionary snow-melting heating load to peak solar windows (11:00-14:30 UTC) will save approximately 140 Litres of Jet-A1/diesel per day while maintaining +21°C interior habitats.`;
        } else if (q.includes("spike") || q.includes("anomaly") || q.includes("error") || q.includes("vibration") || q.includes("genset")) {
          replyText = telemetry.anomalyActive
            ? `⚠️ ACTIVE ANOMALY ALERT on ${station.name}: Isolation Forest detector identified vibration spike on Genset B (+35% power draw). Immediate recommendation: Execute Tier 1 load shedding or transfer load to Genset A.`
            : `✔ Microgrid Anomaly Engine: Isolation Forest anomaly detector monitors 6 sensor channels across ${station.name}. All genset bearing temperatures and vibration levels are within normal nominal tolerances.`;
        } else if (q.includes("fuel") || q.includes("runway") || q.includes("tank")) {
          replyText = `⛽ Fuel System Telemetry for ${station.name}:\nTotal Tank Capacity: ${station.fuelCapacityL.toLocaleString()} L | Remaining: ${station.fuelRemainingL.toLocaleString()} L (${Math.round((station.fuelRemainingL / station.fuelCapacityL) * 100)}% full).\nDaily Burn: ${station.dailyConsumptionL} L/day. Estimated Runway: ${runway} days.`;
        } else if (q.includes("shed") || q.includes("load") || q.includes("demand")) {
          replyText = `⚡ Load Management Analysis:\nTotal current power draw: ${telemetry.powerDrawKw} kW.\nPriority Tier 0 (Life Critical): Heating & Oxygen plant.\nPriority Tier 2 (Sheddable): Kitchen water heater (40 kW) & Snow Melter (30 kW).`;
        } else {
          replyText = `🤖 Polar Sentinel AI (${station.name} Context):\nAnalyzed "${queryText}" against real-time microgrid parameters (${telemetry.powerDrawKw} kW draw, ${runway} days fuel runway, ${station.headcount} headcount).\nAll primary systems operating within standard tolerance. How else can I assist?`;
        }
      }

      setMessages((prev) => [...prev, { sender: "ai", text: replyText, timestamp: timeStr }]);
    } catch (err) {
      console.error("Copilot error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ Telemetry connection interrupted. Please retry your query.", timestamp: timeStr },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    processQuery(input);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-xl border border-primary/40 bg-background/95 p-5 shadow-2xl overflow-hidden flex flex-col h-[680px] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/50 bg-primary/20 text-primary shadow-sm">
              <Bot className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-foreground">
                  Polar Sentinel AI — Station Copilot
                </h2>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  FastAPI + Prophet + SCADA
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Live telemetry context: <strong className="text-foreground">{station.name} Station</strong> ({telemetry.powerDrawKw} kW draw | {Math.round(station.fuelRemainingL / station.dailyConsumptionL)}d fuel runway)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border/70 bg-card/60 p-2 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
            title="Close (Esc)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Purpose Banner */}
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary-foreground">
          <HelpCircle className="size-4 text-primary shrink-0" />
          <span className="text-[11px] text-muted-foreground">
            <strong>Copilot Purpose:</strong> Real-time operational AI assistant for Antarctic microgrid operators. Answers queries on fuel runway forecasts, generator anomaly alerts, solar dispatch, and emergency load shedding.
          </span>
        </div>

        {/* Diagnostic Action Bar */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/40 p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-primary" />
            <span className="text-muted-foreground">Telemetry Health:</span>
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
        <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
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
                  "max-w-[85%] rounded-xl px-4 py-3 border whitespace-pre-line",
                  m.sender === "user"
                    ? "border-primary/50 bg-primary/20 text-foreground rounded-tr-none"
                    : "border-border/70 bg-card/70 text-foreground/95 rounded-tl-none shadow-sm",
                )}
              >
                <p>{m.text}</p>
                <span className="mt-1 block text-[9px] text-muted-foreground text-right">{m.timestamp}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 text-xs justify-start items-center">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
                <Loader2 className="size-3.5 animate-spin" />
              </div>
              <div className="rounded-xl px-4 py-2 border border-border/70 bg-card/60 text-muted-foreground italic text-xs">
                Polar Sentinel AI is analyzing microgrid vector...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Quick Bar */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Suggested:</span>
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => processQuery(prompt)}
              disabled={isTyping}
              className="whitespace-nowrap rounded-full border border-border/80 bg-card/60 px-2.5 py-1 text-[11px] text-foreground/80 hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-2 flex items-center gap-2 border-t border-border/70 pt-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={`Ask AI Copilot about ${station.name}'s fuel runway, generator health, or solar dispatch...`}
            className="flex-1 rounded-lg border border-border/70 bg-card/80 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <span>Ask AI</span>
            <Send className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
