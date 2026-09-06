import { createContext, useContext, useEffect, useMemo, useCallback, useState, type ReactNode } from "react";
import { STATIONS, type StationConfig, type StationId } from "@/lib/station-data";
import { fetchDispatch, fetchCurrentConditions } from "@/lib/api";
import { fetchFuel, fetchFuelForecast, fetchConsumption, fetchShiftRecommendations, fetchLoadShedding, fetchRenewables, fetchEquipmentHealth, fetchSavings, fetchBattery } from "@/lib/api";

interface LiveTelemetry {
  powerDrawKw: number;
  utilizationPct: number;
  flowRateLph: number;
  tempC: number;
  windSpeedMs: number;
  gridFrequencyHz: number;
  anomalyActive: boolean;
}

interface LiveBattery {
  chargeKwh: number;
  capacityKwh: number;
  percent: number;
}

interface LiveFuel {
  remainingL: number;
  capacityL: number;
  percent: number;
  runwayDays: number | null;
  runwayConfidence: { min: number; max: number } | null;
  avgDailyConsumptionL: number;
  history: { date: string; litres: number }[];
}

interface LoadInfo {
  zoneBreakdown: { zone: string; kw: number }[];
  shedding: { required: boolean; message: string; shedZones: any[] };
  shiftRecommendation: { zone: string; reason: string; surplusKw: number } | null;
}

interface EnvHistoryPoint {
  t: string;
  solar: number;
  wind: number;
  temp: number;
}

interface EquipmentAlert {
  equipment_id: string;
  severity: string;
  latest_anomaly_time?: string;
  vibration_deviation_from_normal?: number;
  temperature_deviation_from_normal?: number;
}

interface SavingsInfo {
  actualDieselL: number;
  savedDieselL: number;
  co2AvoidedKg: number;
  periodDays: number;
}

interface StationContextValue {
  stationId: StationId;
  station: StationConfig;
  setStationId: (id: StationId) => void;
  telemetry: LiveTelemetry;
  liveFuel: LiveFuel | null;
  liveBattery: LiveBattery | null;
  renewablePct: number;
  loadInfo: LoadInfo | null;
  envHistory: EnvHistoryPoint[];
  equipmentHealth: EquipmentAlert[];
  savings: SavingsInfo | null;

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

  const baseStation: StationConfig = useMemo(() => {
    if (season === "summer") {
      return {
        ...rawStation,
        polarPhase: "polar day",
        daylightHours: 24,
      };
    }
    return rawStation;
  }, [rawStation, season, stationId]);

  const [liveFuel, setLiveFuel] = useState<LiveFuel | null>(null);
  const [liveBattery, setLiveBattery] = useState<LiveBattery | null>(null);
  const [renewablePct, setRenewablePct] = useState<number>(0);
  const [loadInfo, setLoadInfo] = useState<LoadInfo | null>(null);
  const [envHistory, setEnvHistory] = useState<EnvHistoryPoint[]>([]);
  const [equipmentHealth, setEquipmentHealth] = useState<EquipmentAlert[]>([]);
  const [savings, setSavings] = useState<SavingsInfo | null>(null);
  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    powerDrawKw: baseStation.powerDrawKw,
    utilizationPct: (baseStation.powerDrawKw / baseStation.generatorCapacityKw) * 100,
    flowRateLph: Number((baseStation.dailyConsumptionL / 24).toFixed(1)),
    tempC: baseStation.outsideTempC,
    windSpeedMs: baseStation.windSpeedMs,
    gridFrequencyHz: 50.0,
    anomalyActive: false,
  });

  const setStationId = useCallback((id: StationId) => {
    setStationIdState(id);
    setLiveFuel(null);
    setLiveBattery(null);
    setLoadInfo(null);
    setEnvHistory([]);
    setEquipmentHealth([]);
    setSavings(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, id);
      } catch (err) {
        console.warn("Failed to save station state:", err);
      }
    }
    setAnomalyActive(false);
  }, []);

  // Poll the REAL backend for live telemetry instead of generating random jitter.
  // Fast endpoints only (dispatch, current-conditions, battery) - never the slow Prophet ones here.
  useEffect(() => {
    let cancelled = false;

    async function refreshFromBackend() {
      try {
        const [dispatch, conditions, batteryRes] = await Promise.all([
          fetchDispatch(stationId),
          fetchCurrentConditions(stationId),
          fetchBattery(stationId).catch(() => null),
        ]);

        if (cancelled) return;

        const curStation = STATIONS[stationId];
        const currentKw = dispatch.demand_kw ?? curStation.powerDrawKw;
        const util = curStation.generatorCapacityKw > 0
          ? Number(((currentKw / curStation.generatorCapacityKw) * 100).toFixed(1))
          : 0;

        setTelemetry({
          powerDrawKw: currentKw,
          utilizationPct: util,
          flowRateLph: Number((curStation.dailyConsumptionL / 24).toFixed(1)),
          tempC: conditions.temp_c ?? curStation.outsideTempC,
          windSpeedMs: conditions.wind_ms ?? curStation.windSpeedMs,
          gridFrequencyHz: 50.0,
          anomalyActive,
        });

        if (typeof dispatch?.renewable_percentage === "number") {
          setRenewablePct(dispatch.renewable_percentage);
        }

        if (batteryRes && typeof batteryRes.charge_kwh === "number") {
          setLiveBattery({
            chargeKwh: batteryRes.charge_kwh,
            capacityKwh: batteryRes.capacity_kwh ?? (stationId === "bharati" ? 20.0 : 25.0),
            percent: batteryRes.percent ?? Number(((batteryRes.charge_kwh / (batteryRes.capacity_kwh ?? 20.0)) * 100).toFixed(1)),
          });
        } else if (dispatch && typeof dispatch.battery_charge_kwh === "number") {
          const cap = stationId === "bharati" ? 20.0 : 25.0;
          setLiveBattery({
            chargeKwh: dispatch.battery_charge_kwh,
            capacityKwh: cap,
            percent: Number(((dispatch.battery_charge_kwh / cap) * 100).toFixed(1)),
          });
        } else {
          setLiveBattery(null);
        }
      } catch (err) {
        console.warn("Backend fetch failed, keeping last known telemetry:", err);
      }
    }

    refreshFromBackend();
    const tickIntervalMs = isSatMode ? 15000 : 5000;
    const interval = setInterval(refreshFromBackend, tickIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stationId, anomalyActive, isSatMode]);

  useEffect(() => {
    let cancelled = false;

    async function refreshFuel() {
      try {
        const curStation = STATIONS[stationId];
        const fuelData = await fetchFuel(stationId);
        if (cancelled) return;

        const allReadings = fuelData.fuel ?? [];
        const latest = allReadings.length > 0 ? allReadings[allReadings.length - 1] : null;
        if (latest) {
          const avgConsumption = allReadings.length > 0
            ? allReadings.reduce((sum: number, r: any) => sum + r.diesel_consumed_today, 0) / allReadings.length
            : curStation.dailyConsumptionL;

          // Keep readings in chronological order (oldest to newest) for Recharts XAxis
          const history = allReadings.map((r: any) => ({
            date: r.timestamp.slice(5, 10),
            litres: Math.round(r.diesel_consumed_today),
          }));

          setLiveFuel((prev) => ({
            remainingL: latest.diesel_liters_remaining,
            capacityL: curStation.fuelCapacityL,
            percent: (latest.diesel_liters_remaining / curStation.fuelCapacityL) * 100,
            runwayDays: prev?.runwayDays ?? Math.round(latest.diesel_liters_remaining / avgConsumption),
            runwayConfidence: prev?.runwayConfidence ?? null,
            avgDailyConsumptionL: Math.round(avgConsumption),
            history,
          }));

          // Fetch Prophet forecast asynchronously in background
          fetchFuelForecast(stationId).then((forecast) => {
            if (cancelled || !forecast) return;
            setLiveFuel((prev) => prev ? {
              ...prev,
              runwayDays: forecast.days_remaining ?? prev.runwayDays,
              runwayConfidence: forecast.confidence_range
                ? { min: forecast.confidence_range.min_days, max: forecast.confidence_range.max_days }
                : prev.runwayConfidence,
            } : null);
          }).catch((err) => console.warn("Fuel forecast fetch failed:", err));
        } else {
          setLiveFuel(null);
        }
      } catch (err) {
        console.warn("Fuel fetch failed:", err);
      }
    }

    refreshFuel();
    const interval = setInterval(refreshFuel, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stationId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshLoadInfo() {
      try {
        const [consumption, shedding, shift] = await Promise.all([
          fetchConsumption(stationId),
          fetchLoadShedding(stationId),
          fetchShiftRecommendations(stationId),
        ]);
        if (cancelled) return;

        const latestByZone: Record<string, number> = {};
        for (const row of consumption.consumption ?? []) {
          if (!(row.zone in latestByZone)) {
            latestByZone[row.zone] = row.power_kw;
          }
        }
        const zoneBreakdown = Object.entries(latestByZone).map(([zone, kw]) => ({ zone, kw }));

        const firstRec = shift.recommendations?.[0];

        setLoadInfo({
          zoneBreakdown,
          shedding: {
            required: shedding.shedding_required ?? false,
            message: shedding.message ?? "",
            shedZones: shedding.shed_zones ?? [],
          },
          shiftRecommendation: firstRec
            ? { zone: firstRec.zone, reason: firstRec.reason, surplusKw: firstRec.available_surplus_kw }
            : null,
        });
      } catch (err) {
        console.warn("Load info fetch failed:", err);
      }
    }

    refreshLoadInfo();
    const interval = setInterval(refreshLoadInfo, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stationId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshEnvHistory() {
      try {
        const curStation = STATIONS[stationId];
        const renewables = await fetchRenewables(stationId);
        if (cancelled) return;

        const points = [...(renewables.renewables ?? [])].reverse().map((r: any) => ({
          t: r.timestamp.slice(5, 16).replace("T", " "),
          solar: r.solar_kw,
          wind: r.wind_kw,
          temp: curStation.outsideTempC,
        }));
        setEnvHistory(points);
      } catch (err) {
        console.warn("Environmental history fetch failed:", err);
      }
    }

    refreshEnvHistory();
    const interval = setInterval(refreshEnvHistory, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stationId]);

    useEffect(() => {
    let cancelled = false;

    async function refreshEquipmentHealth() {
      try {
        const result = await fetchEquipmentHealth(stationId);
        if (cancelled) return;
        setEquipmentHealth(result.equipment_health ?? []);
      } catch (err) {
        console.warn("Equipment health fetch failed:", err);
      }
    }

    refreshEquipmentHealth();
    const interval = setInterval(refreshEquipmentHealth, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stationId]);

    useEffect(() => {
    let cancelled = false;

    async function refreshSavings() {
      try {
        const result = await fetchSavings(stationId);
        if (cancelled) return;
        setSavings({
          actualDieselL: result.actual_diesel_used_liters ?? 0,
          savedDieselL: result.diesel_saved_liters ?? 0,
          co2AvoidedKg: result.co2_avoided_kg ?? 0,
          periodDays: result.period_days ?? 0,
        });
      } catch (err) {
        console.warn("Savings fetch failed:", err);
      }
    }

    refreshSavings();
    const interval = setInterval(refreshSavings, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stationId]);

  const triggerAnomaly = useCallback(() => setAnomalyActive(true), []);
  const clearAnomaly = useCallback(() => setAnomalyActive(false), []);
  const toggleSatMode = useCallback(() => setIsSatMode((prev) => !prev), []);
  const toggleSeason = useCallback(() => setSeason((prev) => (prev === "winter" ? "summer" : "winter")), []);

  const value = useMemo(
    () => ({
      stationId,
      station: baseStation,
      setStationId,
      telemetry,
      liveFuel,
      liveBattery,
      renewablePct,
      loadInfo,
      envHistory,
      equipmentHealth,
      savings,
      triggerAnomaly,
      clearAnomaly,
      isSatMode,
      toggleSatMode,
      season,
      toggleSeason,
    }),
    [stationId, baseStation, telemetry, liveFuel, liveBattery, renewablePct, loadInfo, envHistory, equipmentHealth, savings, anomalyActive, isSatMode, season],
  );

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}

export function useStation() {
  const ctx = useContext(StationContext);
  if (!ctx) throw new Error("useStation must be used inside StationProvider");
  return ctx;
}

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