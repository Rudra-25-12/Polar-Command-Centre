import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

export function CommandCentreTransition() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(0);
  const [isWhite, setIsWhite] = useState(false);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    // Check for prefers-reduced-motion safely for SSR
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const performNavigation = () => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;
      navigate({ to: "/dashboard" }).catch((err) => {
        console.error("Router navigation error:", err);
      });
    };

    if (prefersReducedMotion) {
      performNavigation();
      return;
    }

    // Sequence timing (runs cleanly once):
    // t = 0ms: Initiating (Step 0)
    // t = 300ms: Bharati Online (Step 1)
    // t = 650ms: Maitri Online (Step 2)
    // t = 1000ms: Himadri Online (Step 3)
    // t = 1250ms: Background turns to pale ice-white (#f8fafc)
    // t = 1650ms: Single SPA router navigation to /dashboard

    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 650);
    const t3 = setTimeout(() => setStep(3), 1000);
    const t4 = setTimeout(() => setIsWhite(true), 1250);
    const t5 = setTimeout(() => {
      performNavigation();
    }, 1650);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [navigate]);

  const progressPercent = step === 0 ? 25 : step === 1 ? 55 : step === 2 ? 80 : 100;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-6 select-none transition-colors duration-500 ease-in-out ${
        isWhite ? "bg-[#f8fafc] text-slate-900" : "bg-[#060b14] text-slate-100"
      }`}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Institutional Header */}
        <div className="border-b pb-3 border-current/15 flex items-center justify-between font-mono">
          <div className="space-y-0.5">
            <span className="text-[10px] tracking-widest opacity-60 uppercase block">
              NCPOR · MINISTRY OF EARTH SCIENCES
            </span>
            <span className="text-xs font-bold tracking-widest uppercase">
              POLAR NETWORK
            </span>
          </div>
          <span className="text-[10px] opacity-60">
            {step < 3 ? "CONNECTING" : "INITIALIZED"}
          </span>
        </div>

        {/* Operational Status Terminal Output */}
        <div className="space-y-3 text-xs font-mono">
          <div className="text-[11px] opacity-75 tracking-wider">
            INITIALIZING CONNECTION...
          </div>

          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
          >
            <span className="tracking-wider">BHARATI</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
          >
            <span className="tracking-wider">MAITRI</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
          >
            <span className="tracking-wider">HIMADRI</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="space-y-1 pt-1 font-mono">
          <div className="h-1 w-full overflow-hidden rounded-full bg-current/10">
            <div
              className={`h-full transition-all duration-300 ease-out ${
                isWhite ? "bg-emerald-600" : "bg-sky-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] opacity-50">
            <span>COMMAND BUS</span>
            <span>{progressPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
