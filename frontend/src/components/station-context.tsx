import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { STATIONS, type StationConfig, type StationId } from "@/lib/station-data";

interface LiveTelemetry {
  powerDrawKw: number;
  utilizationPct: number;
  flowRateLph: number;
  tempC: number;
  windSpeedMs: number;
  gridFrequencyHz: number;
  anomalyActive: boolean;
}

interface StationContextValue {
  stationId: StationId;
  station: StationConfig;
  setStationId: (id: StationId) => void;
  telemetry: LiveTelemetry;
  triggerAnomaly: () => void;
  clearAnomaly: () => void;
  isSatMode: boolean;
  toggleSatMode: () => void;
  season: "winter" | "summer";
  toggleSeason: () => void;
}

const StationContext = createContext<StationContextValue | null>(null);

const STORAGE_KEY = "psec.station";

export function StationProvider({ children }: { children: ReactNode }) {
  const [stationId, setStationIdState] = useState<StationId>("bharati");
  const [anomalyActive, setAnomalyActive] = useState(false);
  const [isSatMode, setIsSatMode] = useState(false);
  const [season, setSeason] = useState<"winter" | "summer">("winter");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved && saved in STATIONS) {
          setStationIdState(saved as StationId);
        }
      } catch (err) {
        console.warn("Failed to load saved station state:", err);
      }
    }
  }, []);

  const rawStation = STATIONS[stationId];

  // Dynamically derive seasonal adjustments
  const baseStation: StationConfig = useMemo(() => {
    if (season === "summer") {
      return {
        ...rawStation,
        polarPhase: "polar day",
        daylightHours: 24,
        outsideTempC: stationId === "himadri" ? 4.8 : stationId === "bharati" ? 1.5 : -2.4,
        headcount: stationId === "himadri" ? 12 : stationId === "bharati" ? 42 : 55,
      };
    }
    return rawStation;
  }, [rawStation, season, stationId]);

  // Initial live telemetry state synced synchronously with baseStation
  const [telemetry, setTelemetry] = useState<LiveTelemetry>(() => ({
    powerDrawKw: baseStation.powerDrawKw,
    utilizationPct: (baseStation.powerDrawKw / baseStation.generatorCapacityKw) * 100,
    flowRateLph: Number((baseStation.dailyConsumptionL / 24).toFixed(1)),
    tempC: baseStation.outsideTempC,
    windSpeedMs: baseStation.windSpeedMs,
    gridFrequencyHz: 50.0,
    anomalyActive: false,
  }));

  // Synchronous station switch handler to prevent 2s telemetry lag
  const setStationId = (id: StationId) => {
    setStationIdState(id);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, id);
      } catch (err) {
        console.warn("Failed to save station state:", err);
      }
    }
    setAnomalyActive(false);
    const newBase = STATIONS[id];
    setTelemetry({
      powerDrawKw: newBase.powerDrawKw,
      utilizationPct: (newBase.powerDrawKw / newBase.generatorCapacityKw) * 100,
      flowRateLph: Number((newBase.dailyConsumptionL / 24).toFixed(1)),
      tempC: newBase.outsideTempC,
      windSpeedMs: newBase.windSpeedMs,
      gridFrequencyHz: 50.0,
      anomalyActive: false,
    });
  };

  useEffect(() => {
    // In Sat Mode, telemetry refreshes less frequently (10s) to simulate bandwidth constraint
    const tickIntervalMs = isSatMode ? 10000 : 2000;
    const interval = setInterval(() => {
      const anomalyFactor = anomalyActive ? 1.35 : 1;
      const kwJitter = (Math.random() - 0.5) * 2.5;
      const currentKw = Math.max(
        10,
        Number((baseStation.powerDrawKw * anomalyFactor + kwJitter).toFixed(1)),
      );
      const util = Number(((currentKw / baseStation.generatorCapacityKw) * 100).toFixed(1));
      const flow = Number(((baseStation.dailyConsumptionL * anomalyFactor) / 24 + (Math.random() - 0.5) * 1.2).toFixed(1));
      const temp = Number((baseStation.outsideTempC + (Math.random() - 0.5) * 0.4).toFixed(1));
      const wind = Math.max(0, Number((baseStation.windSpeedMs + (Math.random() - 0.5) * 0.8).toFixed(1)));
      const freq = Number((50.0 + (Math.random() - 0.5) * 0.06).toFixed(2));

      setTelemetry({
        powerDrawKw: currentKw,
        utilizationPct: util,
        flowRateLph: flow,
        tempC: temp,
        windSpeedMs: wind,
        gridFrequencyHz: freq,
        anomalyActive,
      });
    }, tickIntervalMs);

    return () => clearInterval(interval);
  }, [baseStation, anomalyActive, isSatMode]);

  const triggerAnomaly = () => setAnomalyActive(true);
  const clearAnomaly = () => setAnomalyActive(false);
  const toggleSatMode = () => setIsSatMode((prev) => !prev);
  const toggleSeason = () => setSeason((prev) => (prev === "winter" ? "summer" : "winter"));

  const value = useMemo(
    () => ({
      stationId,
      station: baseStation,
      setStationId,
      telemetry,
      triggerAnomaly,
      clearAnomaly,
      isSatMode,
      toggleSatMode,
      season,
      toggleSeason,
    }),
    [stationId, baseStation, telemetry, anomalyActive, isSatMode, season],
  );

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}

export function useStation() {
  const ctx = useContext(StationContext);
  if (!ctx) throw new Error("useStation must be used inside StationProvider");
  return ctx;
}

/** Legacy jitter helper for standalone usage. */
export function useLiveValue(base: number, amplitude = 0.015, intervalMs = 2200) {
  const [value, setValue] = useState(base);

  useEffect(() => {
    setValue(base);
    const id = setInterval(() => {
      setValue(base * (1 + (Math.random() - 0.5) * 2 * amplitude));
    }, intervalMs);
    return () => clearInterval(id);
  }, [base, amplitude, intervalMs]);

  return value;
}
