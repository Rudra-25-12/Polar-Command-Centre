/**
 * Simulated station telemetry.
 *
 * Everything here is mock data shaped like the real API payloads we expect
 * later. To go live, replace the generator functions with fetches that return
 * the same types — components only depend on the types below.
 */

export type StationId = "bharati" | "maitri" | "himadri";

export type SourceLabel =
  | "Simulated"
  | "Est. from historical delivery data"
  | "Simulated sensor feed"
  | "Modelled projection";

export type Severity = "nominal" | "warning" | "critical";

export interface SeriesPoint {
  t: string;
  [key: string]: number | string;
}

export interface AlertItem {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  timestamp: string;
  source: SourceLabel;
}

export interface StationConfig {
  id: StationId;
  name: string;
  region: string;
  coordinates: string;
  operatingMode: "year-round" | "seasonal";
  fuelType: string;
  /** Sparser layout for seasonal / shared-infrastructure stations. */
  sharedInfrastructure: boolean;
  established: number;
  summary: string;

  powerDrawKw: number;
  generatorCapacityKw: number;
  fuelCapacityL: number;
  fuelRemainingL: number;
  dailyConsumptionL: number;

  headcount: number;
  typicalRange: [number, number];
  maxCapacity: number;

  polarPhase: "polar day" | "polar night" | "transition";
  daylightHours: number;
  outsideTempC: number;
  windSpeedMs: number;

  loadSplit: { heating: number; labs: number; living: number; utilities: number };
  co2PerLitreKg: number;
  fuelCostPerLitre: number;
}

export const STATIONS: Record<StationId, StationConfig> = {
  bharati: {
    id: "bharati",
    name: "Bharati",
    region: "Larsemann Hills, East Antarctica",
    coordinates: "69.4°S, 76.2°E",
    operatingMode: "year-round",
    fuelType: "Diesel / Jet-A1 blend",
    sharedInfrastructure: false,
    established: 2012,
    summary:
      "Standalone modular microgrid. Container-built station with a comparatively efficient thermal envelope.",
    powerDrawKw: 118,
    generatorCapacityKw: 200,
    fuelCapacityL: 480_000,
    fuelRemainingL: 297_600,
    dailyConsumptionL: 1_180,
    headcount: 24,
    typicalRange: [18, 32],
    maxCapacity: 47,
    polarPhase: "polar night",
    daylightHours: 2.5,
    outsideTempC: -27,
    windSpeedMs: 11.4,
    loadSplit: { heating: 46, labs: 21, living: 20, utilities: 13 },
    co2PerLitreKg: 2.68,
    fuelCostPerLitre: 1.42,
  },
  maitri: {
    id: "maitri",
    name: "Maitri",
    region: "Schirmacher Oasis, Queen Maud Land",
    coordinates: "70.8°S, 11.7°E",
    operatingMode: "year-round",
    fuelType: "Diesel (HSD) bulk",
    sharedInfrastructure: false,
    established: 1989,
    summary:
      "Older year-round station with a larger built footprint and higher thermal losses. Heaviest fuel burn of the three.",
    powerDrawKw: 174,
    generatorCapacityKw: 260,
    fuelCapacityL: 620_000,
    fuelRemainingL: 311_000,
    dailyConsumptionL: 1_940,
    headcount: 31,
    typicalRange: [22, 40],
    maxCapacity: 65,
    polarPhase: "polar night",
    daylightHours: 0,
    outsideTempC: -33,
    windSpeedMs: 16.8,
    loadSplit: { heating: 52, labs: 16, living: 21, utilities: 11 },
    co2PerLitreKg: 2.68,
    fuelCostPerLitre: 1.36,
  },
  himadri: {
    id: "himadri",
    name: "Himadri",
    region: "Ny-Ålesund, Svalbard (Arctic)",
    coordinates: "78.9°N, 11.9°E",
    operatingMode: "seasonal",
    fuelType: "Shared village grid + backup diesel",
    sharedInfrastructure: true,
    established: 2008,
    summary:
      "Seasonal Arctic research base drawing primary power from Ny-Ålesund communal utilities. Baseline weather aligned with NPDC sensor exports (+4.8 °C late-summer avg). Backup diesel on standby.",
    powerDrawKw: 21,
    generatorCapacityKw: 60,
    fuelCapacityL: 26_000,
    fuelRemainingL: 17_500,
    dailyConsumptionL: 96,
    headcount: 6,
    typicalRange: [0, 12],
    maxCapacity: 16,
    polarPhase: "polar day",
    daylightHours: 24,
    outsideTempC: 4.8,
    windSpeedMs: 6.2,
    loadSplit: { heating: 38, labs: 33, living: 17, utilities: 12 },
    co2PerLitreKg: 2.68,
    fuelCostPerLitre: 1.71,
  },
};

export const STATION_ORDER: StationId[] = ["bharati", "maitri", "himadri"];

/* ---------- deterministic pseudo-random helpers ---------- */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function seedOf(id: StationId) {
  return id === "bharati" ? 8123 : id === "maitri" ? 42117 : 9901;
}

function dayLabel(daysAgo: number) {
  const d = new Date(Date.UTC(2026, 8, 4) - daysAgo * 86_400_000);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/* ---------- derived metrics ---------- */

export function fuelPercent(s: StationConfig) {
  return (s.fuelRemainingL / s.fuelCapacityL) * 100;
}

export function runwayDays(s: StationConfig, multiplier = 1) {
  return s.fuelRemainingL / (s.dailyConsumptionL * multiplier);
}

export function utilization(s: StationConfig) {
  return (s.powerDrawKw / s.generatorCapacityKw) * 100;
}

export function severityForRunway(days: number): Severity {
  if (days < 45) return "critical";
  if (days < 120) return "warning";
  return "nominal";
}

/* ---------- time series ---------- */

export function consumptionSeries(s: StationConfig, days = 30): SeriesPoint[] {
  const rnd = seeded(seedOf(s.id));
  return Array.from({ length: days }, (_, i) => {
    const daysAgo = days - 1 - i;
    const wobble = (rnd() - 0.5) * 0.22;
    const seasonal = Math.sin((i / days) * Math.PI) * 0.07;
    const intermittent = s.sharedInfrastructure && rnd() < 0.18 ? 0.35 : 1;
    return {
      t: dayLabel(daysAgo),
      litres: Math.round(s.dailyConsumptionL * (1 + wobble + seasonal) * intermittent),
      baseline: s.dailyConsumptionL,
    };
  });
}

export function powerSeries(s: StationConfig, hours = 24): SeriesPoint[] {
  const rnd = seeded(seedOf(s.id) + 7);
  return Array.from({ length: hours }, (_, h) => {
    const diurnal = Math.sin(((h - 6) / hours) * Math.PI * 2) * 0.09;
    const noise = (rnd() - 0.5) * 0.08;
    const draw = s.powerDrawKw * (1 + diurnal + noise);
    return {
      t: `${String(h).padStart(2, "0")}:00`,
      kw: Math.round(draw),
      capacity: s.generatorCapacityKw,
      heating: Math.round((draw * s.loadSplit.heating) / 100),
    };
  });
}

export function loadBreakdownSeries(s: StationConfig, hours = 24): SeriesPoint[] {
  const rnd = seeded(seedOf(s.id) + 21);
  return Array.from({ length: hours }, (_, h) => {
    const base = s.powerDrawKw * (1 + Math.sin((h / hours) * Math.PI * 2) * 0.08);
    const j = () => 1 + (rnd() - 0.5) * 0.12;
    return {
      t: `${String(h).padStart(2, "0")}:00`,
      heating: Math.round((base * s.loadSplit.heating * j()) / 100),
      labs: Math.round((base * s.loadSplit.labs * j()) / 100),
      living: Math.round((base * s.loadSplit.living * j()) / 100),
      utilities: Math.round((base * s.loadSplit.utilities * j()) / 100),
    };
  });
}

export function forecastSeries(
  s: StationConfig,
  scenario: { multiplier: number } = { multiplier: 1 },
  days = 90,
): SeriesPoint[] {
  const rnd = seeded(seedOf(s.id) + 55);
  let level = s.fuelRemainingL;
  return Array.from({ length: days }, (_, i) => {
    const burn = s.dailyConsumptionL * scenario.multiplier * (1 + (rnd() - 0.5) * 0.06);
    level = Math.max(0, level - burn);
    const spread = level * 0.06 + i * 120;
    return {
      t: `D+${i}`,
      projected: Math.round(level),
      upper: Math.round(Math.min(s.fuelCapacityL, level + spread)),
      lower: Math.round(Math.max(0, level - spread)),
      band: Math.round(Math.min(s.fuelCapacityL, level + spread) - Math.max(0, level - spread)),
    };
  });
}

export function environmentalSeries(s: StationConfig, days = 30): SeriesPoint[] {
  const rnd = seeded(seedOf(s.id) + 88);
  return Array.from({ length: days }, (_, i) => ({
    t: dayLabel(days - 1 - i),
    solar: Math.max(0, Math.round(s.daylightHours * 18 * (1 + (rnd() - 0.5) * 0.4))),
    wind: Number((s.windSpeedMs * (1 + (rnd() - 0.5) * 0.5)).toFixed(1)),
    temp: Number((s.outsideTempC + (rnd() - 0.5) * 9).toFixed(1)),
    polarNight: s.polarPhase === "polar night" ? 1 : 0,
  }));
}

export function fuelCostSeries(s: StationConfig): SeriesPoint[] {
  const rnd = seeded(seedOf(s.id) + 3);
  return [2021, 2022, 2023, 2024, 2025, 2026].map((y, i) => {
    const annualL = s.dailyConsumptionL * 365 * (0.9 + i * 0.03);
    return {
      t: String(y),
      cost: Math.round((annualL * s.fuelCostPerLitre * (1 + (rnd() - 0.5) * 0.1)) / 1000),
      litres: Math.round(annualL / 1000),
    };
  });
}

export function sustainability(s: StationConfig) {
  const annualL = s.dailyConsumptionL * 365;
  const co2 = (annualL * s.co2PerLitreKg) / 1000;
  const renewableShare = s.sharedInfrastructure ? 0.34 : s.id === "bharati" ? 0.26 : 0.19;
  return {
    annualLitres: annualL,
    co2Tonnes: Math.round(co2),
    co2WithRenewables: Math.round(co2 * (1 - renewableShare)),
    renewableShare,
  };
}

export function alertsFor(s: StationConfig): AlertItem[] {
  const days = runwayDays(s);
  const base: AlertItem[] = [
    {
      id: `${s.id}-fuel`,
      title: days < 120 ? "Fuel runway below resupply window" : "Fuel level nominal",
      detail: `${Math.round(days)} days of runway at current burn (${s.dailyConsumptionL} L/day).`,
      severity: severityForRunway(days),
      timestamp: "04 Sep 2026 · 09:12 UTC",
      source: "Est. from historical delivery data",
    },
    {
      id: `${s.id}-gen`,
      title: "Generator B load irregularity",
      detail: "Cyclic 4.2% load oscillation detected on genset B over the last 6 hours.",
      severity: utilization(s) > 70 ? "warning" : "nominal",
      timestamp: "04 Sep 2026 · 06:48 UTC",
      source: "Simulated sensor feed",
    },
    {
      id: `${s.id}-people`,
      title: "Personnel above typical range",
      detail: `Headcount ${s.headcount} vs typical ${s.typicalRange[0]}–${s.typicalRange[1]}.`,
      severity: s.headcount > s.typicalRange[1] ? "warning" : "nominal",
      timestamp: "03 Sep 2026 · 21:05 UTC",
      source: "Simulated",
    },
    {
      id: `${s.id}-sensor`,
      title: "Sensor offline — outer wind mast",
      detail: "No telemetry received for 41 minutes; falling back to modelled values.",
      severity: "warning",
      timestamp: "03 Sep 2026 · 18:33 UTC",
      source: "Simulated sensor feed",
    },
  ];
  return base;
}
