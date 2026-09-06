/**
 * Real backend connector for Polar Station Energy Command.
 * Replaces the mock generators in station-data.ts with live fetches
 * to the FastAPI backend built for SIH26061.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "https://polar-station-energy-system.onrender.com";

async function safeFetch(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchConsumption(station: string) {
  return (await safeFetch(`${API_BASE}/consumption?station=${station}`)) || { consumption: [] };
}

export async function fetchFuel(station: string) {
  return (await safeFetch(`${API_BASE}/fuel?station=${station}`)) || { fuel: [] };
}

export async function fetchFuelForecast(station: string) {
  return (await safeFetch(`${API_BASE}/fuel-forecast?station=${station}`)) || {};
}

export async function fetchLoadForecast(station: string, zone: string = "Heating") {
  return (await safeFetch(`${API_BASE}/load-forecast?station=${station}&zone=${zone}`)) || {};
}

export async function fetchRenewables(station: string) {
  return (await safeFetch(`${API_BASE}/renewables?station=${station}`)) || { renewables: [] };
}

export async function fetchBattery(station: string) {
  return await safeFetch(`${API_BASE}/battery?station=${station}`);
}

export async function fetchDispatch(station: string) {
  return (await safeFetch(`${API_BASE}/dispatch?station=${station}`)) || {};
}

export async function fetchLoadShedding(station: string) {
  return (await safeFetch(`${API_BASE}/load-shedding-status?station=${station}`)) || {};
}

export async function fetchEquipmentHealth(station: string) {
  return (await safeFetch(`${API_BASE}/equipment-health?station=${station}`)) || { equipment_health: [] };
}

export async function fetchSavings(station: string) {
  return (await safeFetch(`${API_BASE}/savings?station=${station}`)) || {};
}

export async function fetchShiftRecommendations(station: string) {
  return (await safeFetch(`${API_BASE}/shift-recommendations?station=${station}`)) || {};
}

export async function fetchHqSummary(station: string) {
  return (await safeFetch(`${API_BASE}/hq-summary?station=${station}`)) || {};
}

export async function fetchScenarioSimulation(station: string, extraSolarKw: number, extraWindKw: number) {
  return (await safeFetch(`${API_BASE}/scenario-simulator?station=${station}&extra_solar_kw=${extraSolarKw}&extra_wind_kw=${extraWindKw}`)) || {};
}

export async function fetchExpansionSuggestion(station: string) {
  return (await safeFetch(`${API_BASE}/renewable-expansion-suggestion?station=${station}`)) || {};
}

export async function fetchSustainabilityReport(station: string) {
  return (await safeFetch(`${API_BASE}/sustainability-report?station=${station}`)) || {};
}

export async function fetchCurrentConditions(station: string) {
  return (await safeFetch(`${API_BASE}/current-conditions?station=${station}`)) || {};
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