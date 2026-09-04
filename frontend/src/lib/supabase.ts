import { createClient } from "@supabase/supabase-js";
import { type StationId } from "./station-data";

/**
 * Supabase client setup for Polar Station Energy Command.
 * Reads environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 * Falls back gracefully if variables are not yet configured.
 */

const supabaseUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConnected = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConnected
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface FuelReadingRow {
  id: string;
  station_id: StationId;
  timestamp: string;
  tank_level_l: number;
  tank_capacity_l: number;
  consumption_rate_lph: number;
}

export interface PowerReadingRow {
  id: string;
  station_id: StationId;
  timestamp: string;
  generation_kw: number;
  load_generation_kw: number;
  load_heating_kw: number;
  load_labs_kw: number;
  load_living_kw: number;
  load_utilities_kw: number;
}

export interface PersonnelLogRow {
  id: string;
  station_id: StationId;
  timestamp: string;
  headcount: number;
  max_capacity: number;
  typical_range_min: number;
  typical_range_max: number;
}

export interface EnvironmentalReadingRow {
  id: string;
  station_id: StationId;
  timestamp: string;
  solar_radiation: number;
  wind_speed: number;
  temperature: number;
}

export interface ForecastRow {
  id: string;
  station_id: StationId;
  generated_at: string;
  horizon_days: number;
  predicted_runway_days: number;
  confidence_lower: number;
  confidence_upper: number;
  scenario: string;
}

export interface AlertRow {
  id: string;
  station_id: StationId;
  timestamp: string;
  severity: "nominal" | "warning" | "critical";
  message: string;
  resolved: boolean;
}
