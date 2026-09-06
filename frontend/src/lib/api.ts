/**
 * Real backend connector for Polar Station Energy Command.
 * Replaces the mock generators in station-data.ts with live fetches
 * to the FastAPI backend built for SIH26061.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "https://polar-station-energy-system.onrender.com";

export async function fetchConsumption(station: string) {
  const res = await fetch(`${API_BASE}/consumption?station=${station}`);
  return res.json();
}

export async function fetchFuel(station: string) {
  const res = await fetch(`${API_BASE}/fuel?station=${station}`);
  return res.json();
}

export async function fetchFuelForecast(station: string) {
  const res = await fetch(`${API_BASE}/fuel-forecast?station=${station}`);
  return res.json();
}

export async function fetchLoadForecast(station: string, zone: string = "Heating") {
  const res = await fetch(`${API_BASE}/load-forecast?station=${station}&zone=${zone}`);
  return res.json();
}

export async function fetchRenewables(station: string) {
  const res = await fetch(`${API_BASE}/renewables?station=${station}`);
  return res.json();
}

export async function fetchBattery(station: string) {
  const res = await fetch(`${API_BASE}/battery?station=${station}`);
  return res.json();
}

export async function fetchDispatch(station: string) {
  const res = await fetch(`${API_BASE}/dispatch?station=${station}`);
  return res.json();
}

export async function fetchLoadShedding(station: string) {
  const res = await fetch(`${API_BASE}/load-shedding-status?station=${station}`);
  return res.json();
}

export async function fetchEquipmentHealth(station: string) {
  const res = await fetch(`${API_BASE}/equipment-health?station=${station}`);
  return res.json();
}

export async function fetchSavings(station: string) {
  const res = await fetch(`${API_BASE}/savings?station=${station}`);
  return res.json();
}

export async function fetchShiftRecommendations(station: string) {
  const res = await fetch(`${API_BASE}/shift-recommendations?station=${station}`);
  return res.json();
}

export async function fetchHqSummary(station: string) {
  const res = await fetch(`${API_BASE}/hq-summary?station=${station}`);
  return res.json();
}

export async function fetchScenarioSimulation(station: string, extraSolarKw: number, extraWindKw: number) {
  const res = await fetch(`${API_BASE}/scenario-simulator?station=${station}&extra_solar_kw=${extraSolarKw}&extra_wind_kw=${extraWindKw}`);
  return res.json();
}

export async function fetchExpansionSuggestion(station: string) {
  const res = await fetch(`${API_BASE}/renewable-expansion-suggestion?station=${station}`);
  return res.json();
}

export async function fetchSustainabilityReport(station: string) {
  const res = await fetch(`${API_BASE}/sustainability-report?station=${station}`);
  return res.json();
}

export async function fetchCurrentConditions(station: string) {
  const res = await fetch(`${API_BASE}/current-conditions?station=${station}`);
  return res.json();
}

export async function fetchCopilotResponse(station: string, query: string) {
  try {
    const res = await fetch(`${API_BASE}/copilot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ station, query }),
    });
    if (!res.ok) throw new Error("Backend request failed");
    return await res.json();
  } catch (err) {
    console.warn("Copilot API fallback:", err);
    return null;
  }
}