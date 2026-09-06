import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Zap,
  Fuel,
  Gauge,
  ArrowRight,
  Thermometer,
  Wind,
  Users,
  MapPin,
  Sun,
  Moon,
  Radio,
  X,
  ShieldCheck,
  Flame,
  BarChart3,
  LineChart,
} from "lucide-react";
import { STATIONS, type StationId, fuelPercent, runwayDays } from "@/lib/station-data";
import { PolarBackground } from "./polar-background";
import { CommandCentreTransition } from "./command-centre-transition";

const STATION_IMAGES: Record<StationId, { webp: string; jpg: string }> = {
  bharati: { webp: "/images/bharati.webp", jpg: "/images/bharati.jpg" },
  maitri: { webp: "/images/maitri.webp", jpg: "/images/maitri.jpg" },
  himadri: { webp: "/images/himadri.webp", jpg: "/images/himadri.jpg" },
};

interface StationModalProps {
  stationId: StationId | null;
  onClose: () => void;
  onEnterDashboard: () => void;
}

function StationInspectionModal({ stationId, onClose, onEnterDashboard }: StationModalProps) {
  if (!stationId) return null;
  const s = STATIONS[stationId];
  const photo = STATION_IMAGES[stationId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-slate-800 bg-[#080e1a] text-slate-100 shadow-2xl">
        {/* Header Photo Bar */}
        <div className="relative h-60 w-full overflow-hidden">
          <picture>
            <source srcSet={photo.webp} type="image/webp" />
            <img
              src={photo.jpg}
              alt={`${s.name} Station Profile`}
              width={1200}
              height={600}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-[#080e1a] via-[#080e1a]/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-md bg-black/60 p-2 text-slate-300 hover:bg-black hover:text-white transition-colors backdrop-blur border border-white/10"
          >
            <X className="size-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-sky-300 uppercase tracking-wider">
                  {s.operatingMode}
                </span>
                <span className="text-xs font-mono text-slate-300">{s.coordinates}</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-1">{s.name} Station Profile</h3>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                <MapPin className="size-3.5 text-sky-400" /> {s.region}
              </p>
            </div>

            <div className="hidden sm:block text-right font-mono text-xs text-slate-400">
              Established <strong className="text-white">{s.established}</strong>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-slate-800 bg-slate-900/60 p-3.5 rounded-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Genset Capacity</span>
              <p className="mt-1 font-mono text-base font-bold text-white">{s.generatorCapacityKw} kW</p>
            </div>
            <div className="border border-slate-800 bg-slate-900/60 p-3.5 rounded-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Current Reserve</span>
              <p className="mt-1 font-mono text-base font-bold text-sky-400">{s.fuelRemainingL.toLocaleString()} L</p>
              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">Farm Cap: {s.fuelCapacityL.toLocaleString()} L</span>
            </div>
            <div className="border border-slate-800 bg-slate-900/60 p-3.5 rounded-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Daily Burn</span>
              <p className="mt-1 font-mono text-base font-bold text-amber-400">{s.dailyConsumptionL.toLocaleString()} L/d</p>
            </div>
            <div className="border border-slate-800 bg-slate-900/60 p-3.5 rounded-md">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Max Personnel</span>
              <p className="mt-1 font-mono text-base font-bold text-emerald-400">{s.maxCapacity} Crew</p>
              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{s.headcount} active on station</span>
            </div>
          </div>

          {/* Technical Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-sky-400">Station Summary & Architecture</h4>
            <p className="text-xs leading-relaxed text-slate-300 bg-slate-900/40 p-4 rounded-md border border-slate-800">
              {s.summary}
            </p>
          </div>

          {/* Load Split & Climate Parameters */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-md space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-mono">
                <Gauge className="size-4 text-sky-400" /> Load Allocation Split
              </h5>
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Space Heating & Thermal</span>
                    <span className="font-mono text-slate-200">{s.loadSplit.heating}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${s.loadSplit.heating}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Scientific Labs & Equipment</span>
                    <span className="font-mono text-slate-200">{s.loadSplit.labs}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${s.loadSplit.labs}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Living Quarters & Life Support</span>
                    <span className="font-mono text-slate-200">{s.loadSplit.living}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.loadSplit.living}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Utilities & Ancillary</span>
                    <span className="font-mono text-slate-200">{s.loadSplit.utilities}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${s.loadSplit.utilities}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900/40 p-4 rounded-md space-y-3">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-mono">
                <Thermometer className="size-4 text-cyan-400" /> Climate Parameters
              </h5>
              <div className="divide-y divide-slate-800 text-xs space-y-2">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Solar Phase:</span>
                  <span className="font-semibold text-slate-200 capitalize flex items-center gap-1">
                    {s.polarPhase === "polar day" ? <Sun className="size-3 text-amber-400" /> : <Moon className="size-3 text-sky-400" />}
                    {s.polarPhase} ({s.daylightHours}h)
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Outside Temp:</span>
                  <span className="font-mono font-semibold text-slate-200">{s.outsideTempC} °C</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Wind Velocity:</span>
                  <span className="font-mono font-semibold text-slate-200">{s.windSpeedMs} m/s</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-400">Fuel Grade:</span>
                  <span className="font-semibold text-slate-200">{s.fuelType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <span className="text-xs font-mono text-slate-400">NCPOR Technical Registry</span>
          <button
            onClick={onEnterDashboard}
            className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-sky-400 cursor-pointer"
          >
            <span>Open Command Dashboard</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const [inspectStationId, setInspectStationId] = useState<StationId | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#060b14] text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-slate-950">
      {/* Active Transition Overlay */}
      {isTransitioning && <CommandCentreTransition />}

      {/* Background Particle Snowfall & Subtle Aurora */}
      <PolarBackground />

      <StationInspectionModal
        stationId={inspectStationId}
        onClose={() => setInspectStationId(null)}
        onEnterDashboard={() => {
          setInspectStationId(null);
          setIsTransitioning(true);
        }}
      />

      {/* Main Page Layout Container */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 sm:space-y-10">
        {/* Brand Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-2 shadow-md border border-slate-700/50 shrink-0 transition-transform hover:scale-105">
              <picture>
                <source srcSet="/logo.webp" type="image/webp" />
                <img
                  src="/logo.png"
                  alt="Polar Energy Logo"
                  width={240}
                  height={90}
                  loading="eager"
                  decoding="async"
                  className="h-12 sm:h-16 md:h-20 w-auto object-contain"
                />
              </picture>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] text-sky-400 block">
                NCPOR · Ministry of Earth Sciences, India
              </span>
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wider text-slate-100 uppercase">
                POLAR COMMAND CENTRE
              </h1>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-4xl mx-auto pt-2">
          {/* Institutional Brand Wordmark */}
          <div className="space-y-2.5 select-none">
            {/* Top Operational Subtitle */}
            <div className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] sm:tracking-[0.35em] text-sky-400 uppercase flex items-center justify-center gap-3">
              <span className="h-px w-6 sm:w-10 bg-sky-500/35 inline-block" />
              <span>INDIAN POLAR OPERATIONS NETWORK</span>
              <span className="h-px w-6 sm:w-10 bg-sky-500/35 inline-block" />
            </div>

            {/* Wordmark Hierarchy Stack */}
            <div className="relative inline-block overflow-hidden py-1.5 px-3">
              {/* One-time Subtle Light Sweep Reveal */}
              <div className="wordmark-light-sweep pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full" />

              {/* POLAR Header Tag */}
              <div className="text-xs sm:text-sm md:text-base font-mono font-semibold tracking-[0.5em] sm:tracking-[0.7em] text-slate-300 uppercase pl-[0.5em] sm:pl-[0.7em]">
                P O L A R
              </div>

              {/* COMMAND CENTRE Primary Brandmark */}
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white uppercase leading-[0.95] mt-1.5 drop-shadow-xs">
                COMMAND CENTRE
              </h2>
            </div>
          </div>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl mx-auto pt-0.5">
            Intelligent energy operations for India's polar research stations.
          </p>

          {/* Understated Primary Action Button */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setIsTransitioning(true)}
              className="group inline-flex items-center gap-2.5 rounded-lg border border-sky-500/50 bg-sky-950/40 px-6 py-3 text-sm font-semibold text-sky-200 transition-all hover:bg-sky-900/60 hover:border-sky-400 hover:text-white shadow-sm cursor-pointer"
            >
              <span>Enter Command Centre</span>
              <ArrowRight className="size-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* Clean Operational Telemetry Statistics Strip (Dividers instead of cards) */}
        <section className="border-y border-slate-800/90 py-6 bg-slate-950/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-slate-800/80 text-left font-mono">
            <div className="px-4 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Active Stations</div>
              <div className="text-xl font-bold text-slate-100">03 <span className="text-xs font-normal text-emerald-400">ONLINE</span></div>
            </div>

            <div className="px-4 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Live Load</div>
              <div className="text-xl font-bold text-sky-400">{STATIONS.bharati.powerDrawKw + STATIONS.maitri.powerDrawKw + STATIONS.himadri.powerDrawKw} kW <span className="text-xs font-normal text-slate-400">TOTAL</span></div>
            </div>

            <div className="px-4 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Personnel</div>
              <div className="text-xl font-bold text-slate-100">{STATIONS.bharati.headcount + STATIONS.maitri.headcount + STATIONS.himadri.headcount} <span className="text-xs font-normal text-slate-400">RESEARCHERS</span></div>
            </div>

            <div className="px-4 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Network Uptime</div>
              <div className="text-xl font-bold text-emerald-400">99.2% <span className="text-xs font-normal text-slate-400">SAT-LINK</span></div>
            </div>
          </div>
        </section>

        {/* Polar Operations Network Section */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-sky-400">
                POLAR NETWORK
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
                Indian Polar Research Stations
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Antarctica & Svalbard Base Operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Bharati Station */}
            <div
              onClick={() => setInspectStationId("bharati")}
              className="group cursor-pointer border border-slate-800/90 bg-[#09101d] overflow-hidden transition-all duration-300 hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-56 w-full overflow-hidden">
                  <picture>
                    <source srcSet="/images/bharati.webp" type="image/webp" />
                    <img
                      src="/images/bharati.jpg"
                      alt="Bharati Antarctic Research Station"
                      width={600}
                      height={350}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09101d] via-[#09101d]/20 to-transparent" />
                  
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] font-mono text-sky-300 flex items-center gap-1 mb-0.5">
                      <MapPin className="size-3 text-sky-400" /> Larsemann Hills (69.41° S)
                    </span>
                    <h4 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                      BHARATI STATION
                    </h4>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    Containerized aerodynamic station on steel stilts. Combined Heat & Power microgrid.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3 font-mono">
                    <div className="p-2 border border-slate-800/60 bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">Capacity:</span>
                      <span className="font-semibold text-white">{STATIONS.bharati.generatorCapacityKw} kW</span>
                    </div>
                    <div className="p-2 border border-slate-800/60 bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">Reserve:</span>
                      <span className="font-semibold text-sky-400">{Math.round(STATIONS.bharati.fuelRemainingL / 1000)}k L</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Maitri Station */}
            <div
              onClick={() => setInspectStationId("maitri")}
              className="group cursor-pointer border border-slate-800/90 bg-[#09101d] overflow-hidden transition-all duration-300 hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-56 w-full overflow-hidden">
                  <picture>
                    <source srcSet="/images/maitri.webp" type="image/webp" />
                    <img
                      src="/images/maitri.jpg"
                      alt="Maitri Antarctic Research Station"
                      width={600}
                      height={350}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09101d] via-[#09101d]/20 to-transparent" />
                  
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1 mb-0.5">
                      <MapPin className="size-3 text-amber-400" /> Schirmacher Oasis (70.77° S)
                    </span>
                    <h4 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      MAITRI STATION
                    </h4>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    India’s 2nd permanent Antarctic base on rocky oasis over Priyadarshini Lake. Heavy-duty diesel microgrid.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3 font-mono">
                    <div className="p-2 border border-slate-800/60 bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">Capacity:</span>
                      <span className="font-semibold text-white">{STATIONS.maitri.generatorCapacityKw} kW</span>
                    </div>
                    <div className="p-2 border border-slate-800/60 bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">Reserve:</span>
                      <span className="font-semibold text-amber-400">{Math.round(STATIONS.maitri.fuelRemainingL / 1000)}k L</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Himadri Base */}
            <div
              onClick={() => setInspectStationId("himadri")}
              className="group cursor-pointer border border-slate-800/90 bg-[#09101d] overflow-hidden transition-all duration-300 hover:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-56 w-full overflow-hidden">
                  <picture>
                    <source srcSet="/images/himadri.webp" type="image/webp" />
                    <img
                      src="/images/himadri.jpg"
                      alt="Himadri Arctic Research Base"
                      width={600}
                      height={350}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09101d] via-[#09101d]/20 to-transparent" />
                  
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] font-mono text-cyan-300 flex items-center gap-1 mb-0.5">
                      <MapPin className="size-3 text-cyan-400" /> Ny-Ålesund, Svalbard (78.92° N)
                    </span>
                    <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      HIMADRI BASE
                    </h4>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    India’s flagship Arctic station 1,200 km from North Pole. Ny-Ålesund municipal power grid mode.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3 font-mono">
                    <div className="p-2 border border-slate-800/60 bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">Grid Import:</span>
                      <span className="font-semibold text-white">{STATIONS.himadri.powerDrawKw} kW</span>
                    </div>
                    <div className="p-2 border border-slate-800/60 bg-slate-950/40">
                      <span className="text-slate-400 text-[10px] block">Reserve:</span>
                      <span className="font-semibold text-cyan-300">{(STATIONS.himadri.fuelRemainingL / 1000).toFixed(1)}k L</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Subsystems Architecture Section */}
        <section className="border-t border-slate-800/80 pt-12 space-y-6">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-sky-400">
              CORE CAPABILITIES
            </span>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">
              Command Infrastructure Subsystems
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
            <div className="pt-4 sm:pt-0 sm:pr-4 space-y-1.5">
              <div className="font-mono font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="size-3.5 text-sky-400" /> LOAD FORECASTING
              </div>
              <p className="text-slate-400 leading-relaxed font-normal">
                Predictive AI demand modeling for extreme polar climates, balancing space heating, scientific lab loads, and seasonal personnel variations.
              </p>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-4 space-y-1.5">
              <div className="font-mono font-bold text-slate-100 flex items-center gap-2">
                <Sun className="size-3.5 text-emerald-400" /> RENEWABLE ENERGY INTEGRATION
              </div>
              <p className="text-slate-400 leading-relaxed font-normal">
                Hybrid microgrid synchronization of solar PV arrays, wind turbines, and energy storage systems to maximize green power fraction in polar zones.
              </p>
            </div>

            <div className="pt-4 sm:pt-0 sm:pl-4 space-y-1.5">
              <div className="font-mono font-bold text-slate-100 flex items-center gap-2">
                <Fuel className="size-3.5 text-amber-400" /> FUEL OPTIMIZATION
              </div>
              <p className="text-slate-400 leading-relaxed font-normal">
                Intelligent genset load balancing, fuel burn minimization, reserve runway tracking, and resupply ship logistics optimization.
              </p>
            </div>
          </div>
        </section>

        {/* Minimal Institutional Footer */}
        <footer className="border-t border-slate-800/80 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-sky-400" />
            <span>National Centre for Polar and Ocean Research (NCPOR) • Ministry of Earth Sciences</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
