import type { FC } from "react";

export interface StationIllustrationProps {
  className?: string;
  stationId: "bharati" | "maitri" | "himadri" | "dakshin_gangotri" | "indarc";
}

export const StationIllustration: FC<StationIllustrationProps> = ({ stationId, className = "w-full h-48" }) => {
  if (stationId === "bharati") {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 via-sky-950 to-slate-950 p-4 border border-sky-500/20 shadow-inner group ${className}`}>
        {/* Background Aurora / Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/20 via-sky-600/10 to-transparent animate-pulse" />
        <div className="absolute top-2 right-4 text-[10px] font-mono tracking-widest text-sky-400/80 uppercase">
          69.41° S, 76.19° E · Antarctica
        </div>

        {/* SVG Illustration of Bharati Station */}
        <svg viewBox="0 0 400 200" className="w-full h-full object-contain relative z-10" fill="none">
          {/* Mountains & Ice Horizon */}
          <path d="M0 160 L60 130 L140 150 L220 120 L310 145 L400 125 L400 200 L0 200 Z" fill="#0f172a" opacity="0.7" />
          <path d="M0 170 L100 150 L200 165 L300 155 L400 168 L400 200 L0 200 Z" fill="#1e293b" />
          
          {/* Snow Ice Ground */}
          <ellipse cx="200" cy="180" rx="180" ry="15" fill="#38bdf8" opacity="0.15" />

          {/* Aerodynamic Container Station Main Structure (Bharati 134 Containers Design) */}
          {/* Stilts Supporting Main Building */}
          <rect x="110" y="140" width="8" height="25" fill="#475569" />
          <rect x="160" y="140" width="8" height="25" fill="#475569" />
          <rect x="230" y="140" width="8" height="25" fill="#475569" />
          <rect x="280" y="140" width="8" height="25" fill="#475569" />

          {/* Main Hull Structure with Rounded Aerodynamic Nose */}
          <path d="M90 120 Q100 100 120 100 L280 100 Q300 100 310 120 L300 142 L100 142 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          
          {/* Metallic Panel lines */}
          <line x1="140" y1="100" x2="140" y2="142" stroke="#0369a1" strokeWidth="1.5" />
          <line x1="180" y1="100" x2="180" y2="142" stroke="#0369a1" strokeWidth="1.5" />
          <line x1="220" y1="100" x2="220" y2="142" stroke="#0369a1" strokeWidth="1.5" />
          <line x1="260" y1="100" x2="260" y2="142" stroke="#0369a1" strokeWidth="1.5" />

          {/* Glowing Windows Row */}
          <rect x="115" y="112" width="18" height="10" rx="2" fill="#fbbf24" className="shadow-lg shadow-amber-400/50" />
          <rect x="145" y="112" width="24" height="10" rx="2" fill="#38bdf8" />
          <rect x="185" y="112" width="30" height="10" rx="2" fill="#fbbf24" />
          <rect x="225" y="112" width="24" height="10" rx="2" fill="#38bdf8" />
          <rect x="265" y="112" width="18" height="10" rx="2" fill="#fbbf24" />

          {/* Helipad & Antenna array */}
          <rect x="65" y="140" width="35" height="4" fill="#64748b" />
          <line x1="82" y1="140" x2="82" y2="155" stroke="#64748b" strokeWidth="3" />
          <circle cx="82" cy="138" r="3" fill="#ef4444" className="animate-ping" />
          
          {/* Satellite Radome Dome */}
          <circle cx="200" cy="88" r="14" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="200" y1="74" x2="200" y2="65" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="200" cy="64" r="2" fill="#38bdf8" />

          {/* Indian Tricolor Flag Mast */}
          <line x1="285" y1="100" x2="285" y2="70" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="285" y="70" width="16" height="3.5" fill="#f97316" />
          <rect x="285" y="73.5" width="16" height="3.5" fill="#ffffff" />
          <rect x="285" y="77" width="16" height="3.5" fill="#16a34a" />
          <circle cx="293" cy="75.2" r="1" fill="#1e3a8a" />
        </svg>

        <div className="absolute bottom-2 left-4 text-xs font-semibold text-sky-200">
          BHARATI STATION <span className="text-[10px] font-normal text-sky-400">(Containerised CHP Microgrid)</span>
        </div>
      </div>
    );
  }

  if (stationId === "maitri") {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-4 border border-amber-500/20 shadow-inner group ${className}`}>
        {/* Background Aurora / Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-purple-600/10 to-transparent" />
        <div className="absolute top-2 right-4 text-[10px] font-mono tracking-widest text-amber-400/80 uppercase">
          70.77° S, 11.74° E · Schirmacher Oasis
        </div>

        {/* SVG Illustration of Maitri Station */}
        <svg viewBox="0 0 400 200" className="w-full h-full object-contain relative z-10" fill="none">
          {/* Schirmacher Oasis Rocky Hills */}
          <path d="M0 150 Q70 120 140 145 T280 130 T400 155 L400 200 L0 200 Z" fill="#1e1b4b" opacity="0.9" />
          
          {/* Priyadarshini Frozen Lake */}
          <ellipse cx="200" cy="180" rx="190" ry="12" fill="#0284c7" opacity="0.3" />

          {/* Maitri Main Two-Story Structure */}
          <rect x="120" y="110" width="160" height="45" rx="3" fill="#dc2626" stroke="#ef4444" strokeWidth="1.5" />
          {/* Second tier roof block */}
          <rect x="150" y="90" width="100" height="22" rx="2" fill="#b91c1c" stroke="#dc2626" strokeWidth="1" />

          {/* Windows Rows */}
          <rect x="135" y="122" width="14" height="12" rx="1" fill="#fef08a" />
          <rect x="160" y="122" width="14" height="12" rx="1" fill="#fef08a" />
          <rect x="185" y="122" width="14" height="12" rx="1" fill="#38bdf8" />
          <rect x="210" y="122" width="14" height="12" rx="1" fill="#fef08a" />
          <rect x="235" y="122" width="14" height="12" rx="1" fill="#fef08a" />

          {/* Upper Windows */}
          <rect x="165" y="96" width="12" height="9" rx="1" fill="#fef08a" />
          <rect x="194" y="96" width="12" height="9" rx="1" fill="#fef08a" />
          <rect x="223" y="96" width="12" height="9" rx="1" fill="#38bdf8" />

          {/* Large Fuel Storage Tanks on Oasis Rocks */}
          <rect x="60" y="132" width="30" height="20" rx="4" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <rect x="30" y="136" width="26" height="16" rx="4" fill="#334155" stroke="#475569" strokeWidth="1" />
          <text x="65" y="145" fill="#f8fafc" fontSize="6" fontFamily="sans-serif" fontWeight="bold">DIESEL</text>

          {/* Communications & Satellite Radome */}
          <circle cx="315" cy="130" r="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="315" y1="118" x2="315" y2="105" stroke="#94a3b8" strokeWidth="1.5" />

          {/* Indian Flag */}
          <line x1="260" y1="90" x2="260" y2="60" stroke="#e2e8f0" strokeWidth="2" />
          <rect x="260" y="60" width="16" height="3.5" fill="#f97316" />
          <rect x="260" y="63.5" width="16" height="3.5" fill="#ffffff" />
          <rect x="260" y="67" width="16" height="3.5" fill="#16a34a" />
          <circle cx="268" cy="65.2" r="1" fill="#1e3a8a" />
        </svg>

        <div className="absolute bottom-2 left-4 text-xs font-semibold text-amber-200">
          MAITRI STATION <span className="text-[10px] font-normal text-amber-400">(Legacy Heavy-Duty Microgrid)</span>
        </div>
      </div>
    );
  }

  if (stationId === "himadri") {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 via-cyan-950 to-slate-950 p-4 border border-cyan-500/20 shadow-inner group ${className}`}>
        {/* Background Aurora / Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/15 via-cyan-600/10 to-transparent" />
        <div className="absolute top-2 right-4 text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">
          78.92° N, 11.93° E · Svalbard (Arctic)
        </div>

        {/* SVG Illustration of Himadri Station */}
        <svg viewBox="0 0 400 200" className="w-full h-full object-contain relative z-10" fill="none">
          {/* Svalbard Arctic Fjord & Snow Peak Mountains */}
          <path d="M0 130 L70 90 L130 140 L210 80 L300 135 L400 95 L400 200 L0 200 Z" fill="#0f172a" opacity="0.8" />
          <path d="M0 160 L120 145 L240 160 L400 150 L400 200 L0 200 Z" fill="#164e63" opacity="0.5" />

          {/* Kongsfjorden Blue Water */}
          <rect x="0" y="172" width="400" height="28" fill="#0891b2" opacity="0.4" />

          {/* Ny-Ålesund Village Scandinavian Style Wooden Building (Himadri) */}
          <polygon points="150,105 250,105 200,80" fill="#0e7490" />
          <rect x="155" y="105" width="90" height="50" fill="#155e75" stroke="#22d3ee" strokeWidth="1.5" />

          {/* Traditional Pitch Roof Windows & Door */}
          <rect x="170" y="118" width="16" height="16" rx="1" fill="#fef08a" />
          <rect x="214" y="118" width="16" height="16" rx="1" fill="#fef08a" />
          <rect x="192" y="132" width="16" height="23" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1" />

          {/* Weather Mast & Solar Panels (Polar Day setup) */}
          <line x1="125" y1="155" x2="125" y2="100" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="115" y1="115" x2="135" y2="115" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="125" cy="98" r="3" fill="#38bdf8" className="animate-pulse" />

          {/* Solar Array Panel */}
          <polygon points="270,140 310,135 315,150 275,155" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
          <line x1="290" y1="148" x2="290" y2="160" stroke="#64748b" strokeWidth="2" />

          {/* Indian Flag */}
          <line x1="200" y1="80" x2="200" y2="52" stroke="#e2e8f0" strokeWidth="2" />
          <rect x="200" y="52" width="16" height="3.5" fill="#f97316" />
          <rect x="200" y="55.5" width="16" height="3.5" fill="#ffffff" />
          <rect x="200" y="59" width="16" height="3.5" fill="#16a34a" />
          <circle cx="208" cy="57.2" r="1" fill="#1e3a8a" />
        </svg>

        <div className="absolute bottom-2 left-4 text-xs font-semibold text-cyan-200">
          HIMADRI STATION <span className="text-[10px] font-normal text-cyan-400">(Ny-Ålesund Municipal Grid + Standby Diesel)</span>
        </div>
      </div>
    );
  }

  if (stationId === "dakshin_gangotri") {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 p-4 border border-blue-500/20 shadow-inner ${className}`}>
        <div className="absolute top-2 right-4 text-[10px] font-mono tracking-widest text-blue-400/80 uppercase">
          70.08° S, 12.00° E · Est. 1983 (Historical)
        </div>
        <svg viewBox="0 0 400 200" className="w-full h-full object-contain relative z-10" fill="none">
          {/* Ice Shelf Covering Station */}
          <path d="M0 100 Q200 80 400 110 L400 200 L0 200 Z" fill="#1e293b" />
          <rect x="140" y="125" width="120" height="35" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
          <text x="150" y="145" fill="#e2e8f0" fontSize="10" fontFamily="sans-serif" fontWeight="bold">DAKSHIN GANGOTRI</text>
          <text x="150" y="155" fill="#94a3b8" fontSize="7" fontFamily="sans-serif">Historical 1st Base (1983-1990)</text>
        </svg>
        <div className="absolute bottom-2 left-4 text-xs font-semibold text-blue-200">
          DAKSHIN GANGOTRI <span className="text-[10px] font-normal text-blue-400">(India's 1st Antarctic Base / Supply Depot)</span>
        </div>
      </div>
    );
  }

  // IndARC
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-slate-900 via-teal-950 to-slate-950 p-4 border border-teal-500/20 shadow-inner ${className}`}>
      <div className="absolute top-2 right-4 text-[10px] font-mono tracking-widest text-teal-400/80 uppercase">
        78.9° N · Kongsfjorden Mooring
      </div>
      <svg viewBox="0 0 400 200" className="w-full h-full object-contain relative z-10" fill="none">
        <rect x="0" y="0" width="400" height="70" fill="#0f172a" />
        <rect x="0" y="70" width="400" height="130" fill="#042f2e" opacity="0.8" />
        <line x1="200" y1="70" x2="200" y2="180" stroke="#2dd4bf" strokeDasharray="4 4" strokeWidth="2" />
        <circle cx="200" cy="120" r="10" fill="#0d9488" stroke="#5eead4" strokeWidth="2" />
        <text x="220" y="124" fill="#ccfbf1" fontSize="9" fontFamily="sans-serif" fontWeight="bold">IndARC Mooring Payload</text>
      </svg>
      <div className="absolute bottom-2 left-4 text-xs font-semibold text-teal-200">
        IndARC <span className="text-[10px] font-normal text-teal-400">(Sub-surface Arctic Mooring Observatory)</span>
      </div>
    </div>
  );
};
