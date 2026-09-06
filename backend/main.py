import os
from fastapi import FastAPI
import sqlite3
import pandas as pd
from datetime import datetime
from prophet import Prophet
from station_config import get_station
from anomaly_detection import detect_anomalies
from shiftable_loads import find_shift_recommendations
from load_shedding import decide_load_shedding

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "station_data.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def read_root():
    return {"message": "Polar Station Backend is running"}

@app.get("/stations")
def list_stations():
    from station_config import STATIONS
    return {
        sid: {"name": s["name"], "region": s["region"], "standalone_microgrid": s["standalone_microgrid"]}
        for sid, s in STATIONS.items()
    }

@app.get("/consumption")
def get_consumption(station: str = "bharati"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT timestamp, zone, power_kw FROM consumption WHERE station_id = ? ORDER BY timestamp DESC LIMIT 50",
        (station,)
    )
    rows = cursor.fetchall()
    conn.close()
    return {"station": station, "consumption": [dict(row) for row in rows]}

@app.get("/fuel")
def get_fuel(station: str = "bharati"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT timestamp, diesel_liters_remaining, diesel_consumed_today FROM fuel WHERE station_id = ? ORDER BY timestamp ASC",
        (station,)
    )
    rows = cursor.fetchall()
    conn.close()
    return {"station": station, "fuel": [dict(row) for row in rows]}

@app.get("/renewables")
def get_renewables(station: str = "bharati"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT timestamp, solar_kw, wind_kw FROM renewables WHERE station_id = ? ORDER BY timestamp DESC LIMIT 50",
        (station,)
    )
    rows = cursor.fetchall()
    conn.close()
    return {"station": station, "renewables": [dict(row) for row in rows]}

@app.get("/load-forecast")
def get_load_forecast(station: str = "bharati", zone: str = "Heating"):
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(
        "SELECT timestamp, power_kw FROM consumption WHERE station_id = ? AND zone = ? ORDER BY timestamp ASC",
        conn, params=(station, zone)
    )
    conn.close()

    if len(df) < 10:
        return {"station": station, "zone": zone, "message": "Not enough historical data to forecast yet"}

    df = df.rename(columns={"timestamp": "ds", "power_kw": "y"})
    df["ds"] = pd.to_datetime(df["ds"])

    model = Prophet(interval_width=0.90, daily_seasonality=True)
    model.fit(df)

    future = model.make_future_dataframe(periods=48, freq="h")
    forecast = model.predict(future)

    upcoming = forecast[forecast["ds"] > df["ds"].max()].head(24)

    predictions = [
        {
            "timestamp": row["ds"].isoformat(),
            "predicted_kw": round(row["yhat"], 2),
            "range_min_kw": round(row["yhat_lower"], 2),
            "range_max_kw": round(row["yhat_upper"], 2)
        }
        for _, row in upcoming.iterrows()
    ]

    return {"station": station, "zone": zone, "forecast_next_24h": predictions}

@app.get("/fuel-forecast")
def get_fuel_forecast(station: str = "bharati"):
    station_cfg = get_station(station)
    if station_cfg["annual_fuel_l_range"][0] is None:
        return {"station": station, "message": "No fuel system applicable for this station"}

    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(
        "SELECT timestamp, diesel_liters_remaining FROM fuel WHERE station_id = ? ORDER BY timestamp ASC",
        conn, params=(station,)
    )
    conn.close()

    df = df.rename(columns={"timestamp": "ds", "diesel_liters_remaining": "y"})
    df["ds"] = pd.to_datetime(df["ds"])

    model = Prophet(interval_width=0.90, yearly_seasonality=False)
    model.fit(df)

    future = model.make_future_dataframe(periods=730)
    forecast = model.predict(future)

    depletion_row = forecast[forecast["yhat"] <= 0].head(1)

    if depletion_row.empty:
        return {"station": station, "days_remaining": None, "confidence_range": None, "message": "No depletion predicted"}

    depletion_date = depletion_row["ds"].values[0]
    today = pd.Timestamp.now()
    days_remaining = (pd.Timestamp(depletion_date) - today).days

    lower_depletion = forecast[forecast["yhat_upper"] <= 0].head(1)
    upper_depletion = forecast[forecast["yhat_lower"] <= 0].head(1)

    days_lower = (pd.Timestamp(lower_depletion["ds"].values[0]) - today).days if not lower_depletion.empty else days_remaining
    days_upper = (pd.Timestamp(upper_depletion["ds"].values[0]) - today).days if not upper_depletion.empty else days_remaining

    return {
        "station": station,
        "days_remaining": days_remaining,
        "confidence_range": {"min_days": min(days_lower, days_upper), "max_days": max(days_lower, days_upper)}
    }

@app.get("/dispatch")
def get_current_dispatch(station: str = "bharati"):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT solar_kw, wind_kw FROM renewables WHERE station_id = ? ORDER BY timestamp DESC LIMIT 1", (station,))
    renewable_row = cursor.fetchone()

    cursor.execute("""
        SELECT SUM(power_kw) as total_demand FROM consumption
        WHERE station_id = ? AND timestamp = (SELECT MAX(timestamp) FROM consumption WHERE station_id = ?)
    """, (station, station))
    demand_row = cursor.fetchone()

    cursor.execute("SELECT charge_kwh FROM battery WHERE station_id = ? ORDER BY timestamp DESC LIMIT 1", (station,))
    battery_row = cursor.fetchone()

    conn.close()

    if not renewable_row or not demand_row:
        return {"station": station, "error": "Not enough data yet"}

    solar_kw = renewable_row["solar_kw"]
    wind_kw = renewable_row["wind_kw"]
    demand_kw = demand_row["total_demand"] or 0
    battery_available_kw = battery_row["charge_kwh"] if battery_row else 0

    renewable_available = solar_kw + wind_kw
    from_renewables = min(demand_kw, renewable_available)
    remaining = demand_kw - from_renewables
    from_battery = min(remaining, battery_available_kw)
    remaining -= from_battery
    from_diesel = remaining

    return {
        "station": station,
        "demand_kw": round(demand_kw, 2),
        "from_renewables": round(from_renewables, 2),
        "from_battery": round(from_battery, 2),
        "from_diesel": round(from_diesel, 2),
        "battery_charge_kwh": round(battery_available_kw, 2),
        "renewable_percentage": round((from_renewables / demand_kw) * 100, 1) if demand_kw > 0 else 0
    }

@app.get("/load-shedding-status")
def get_load_shedding_status(station: str = "bharati"):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT SUM(power_kw) as total_demand FROM consumption
        WHERE station_id = ? AND timestamp = (SELECT MAX(timestamp) FROM consumption WHERE station_id = ?)
    """, (station, station))
    demand_row = cursor.fetchone()

    cursor.execute("SELECT solar_kw, wind_kw FROM renewables WHERE station_id = ? ORDER BY timestamp DESC LIMIT 1", (station,))
    renewable_row = cursor.fetchone()

    cursor.execute("SELECT charge_kwh FROM battery WHERE station_id = ? ORDER BY timestamp DESC LIMIT 1", (station,))
    battery_row = cursor.fetchone()

    conn.close()

    demand_kw = demand_row["total_demand"] or 0
    battery_kw = battery_row["charge_kwh"] if battery_row else 0
    available_supply_kw = (renewable_row["solar_kw"] + renewable_row["wind_kw"] if renewable_row else 0) + battery_kw

    result = decide_load_shedding(demand_kw, available_supply_kw)
    result["station"] = station
    return result

@app.get("/equipment-health")
def get_equipment_health(station: str = "bharati"):
    results = detect_anomalies(station)
    return {"station": station, "equipment_health": results}

@app.get("/savings")
def get_savings(station: str = "bharati"):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT SUM(diesel_consumed_today) as total_actual FROM fuel WHERE station_id = ?", (station,))
    actual_row = cursor.fetchone()
    total_actual_diesel = actual_row["total_actual"] or 0

    cursor.execute("SELECT COUNT(*) as day_count FROM fuel WHERE station_id = ?", (station,))
    count_row = cursor.fetchone()
    day_count = count_row["day_count"] or 1

    conn.close()

    baseline_diesel = total_actual_diesel * 1.4
    diesel_saved = baseline_diesel - total_actual_diesel
    co2_avoided_kg = diesel_saved * 2.68

    return {
        "station": station,
        "period_days": day_count,
        "actual_diesel_used_liters": round(total_actual_diesel, 1),
        "estimated_baseline_diesel_liters": round(baseline_diesel, 1),
        "diesel_saved_liters": round(diesel_saved, 1),
        "co2_avoided_kg": round(co2_avoided_kg, 1)
    }

@app.get("/shift-recommendations")
def get_shift_recommendations(station: str = "bharati"):
    result = find_shift_recommendations(station)
    result["station"] = station
    return result

@app.get("/hq-summary")
def get_hq_summary(station: str = "bharati"):
    fuel_forecast = get_fuel_forecast(station)
    dispatch = get_current_dispatch(station)
    shedding = get_load_shedding_status(station)
    equipment = get_equipment_health(station)

    alert_count = sum(1 for e in equipment["equipment_health"] if e.get("severity") == "HIGH")

    return {
        "station": station,
        "fuel_days_remaining": fuel_forecast.get("days_remaining"),
        "renewable_pct": dispatch.get("renewable_percentage"),
        "shedding_active": shedding.get("shedding_required", False),
        "high_severity_alerts": alert_count,
        "last_synced": datetime.now().isoformat()
    }

@app.get("/scenario-simulator")
def run_scenario(station: str = "bharati", extra_solar_kw: float = 0, extra_wind_kw: float = 0):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT solar_kw, wind_kw FROM renewables WHERE station_id = ? ORDER BY timestamp DESC LIMIT 1", (station,))
    renewable_row = cursor.fetchone()
    cursor.execute("""
        SELECT SUM(power_kw) as total_demand FROM consumption
        WHERE station_id = ? AND timestamp = (SELECT MAX(timestamp) FROM consumption WHERE station_id = ?)
    """, (station, station))
    demand_row = cursor.fetchone()
    conn.close()

    demand_kw = demand_row["total_demand"] or 0
    current_renewable = renewable_row["solar_kw"] + renewable_row["wind_kw"] if renewable_row else 0
    simulated_renewable = current_renewable + extra_solar_kw + extra_wind_kw

    current_pct = round((min(demand_kw, current_renewable) / demand_kw) * 100, 1) if demand_kw > 0 else 0
    simulated_pct = round((min(demand_kw, simulated_renewable) / demand_kw) * 100, 1) if demand_kw > 0 else 0

    diesel_reduction_kw = min(demand_kw, simulated_renewable) - min(demand_kw, current_renewable)
    annual_diesel_saved_l = diesel_reduction_kw * 24 * 365 * 0.238

    return {
        "station": station,
        "current_renewable_pct": current_pct,
        "simulated_renewable_pct": simulated_pct,
        "added_capacity_kw": extra_solar_kw + extra_wind_kw,
        "estimated_annual_diesel_saved_liters": round(annual_diesel_saved_l, 0)
    }

@app.get("/renewable-expansion-suggestion")
def suggest_expansion(station: str = "bharati"):
    dispatch = get_current_dispatch(station)
    demand_kw = dispatch.get("demand_kw", 0)
    current_pct = dispatch.get("renewable_percentage", 0)

    if current_pct >= 90:
        return {"station": station, "message": "Renewable coverage already high; no major expansion needed.", "current_renewable_pct": current_pct}

    target_pct = 80
    additional_kw_needed = round((target_pct/100 * demand_kw) - (current_pct/100 * demand_kw), 1)

    return {
        "station": station,
        "current_renewable_pct": current_pct,
        "target_renewable_pct": target_pct,
        "suggested_additional_capacity_kw": max(0, additional_kw_needed),
        "message": f"Adding approximately {max(0, additional_kw_needed)} kW of solar/wind capacity would raise renewable coverage toward {target_pct}%."
    }

@app.get("/sustainability-report")
def generate_sustainability_report(station: str = "bharati"):
    savings = get_savings(station)
    dispatch = get_current_dispatch(station)
    fuel_forecast = get_fuel_forecast(station)
    station_cfg = get_station(station)

    report_lines = [
        f"SUSTAINABILITY & ENERGY REPORT",
        f"Station: {station_cfg['name']} ({station_cfg['region']})",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}",
        "=" * 50,
        "",
        f"FUEL STATUS",
        f"  Days remaining (forecast): {fuel_forecast.get('days_remaining', 'N/A')}",
        f"  Confidence range: {fuel_forecast.get('confidence_range', 'N/A')}",
        "",
        f"RENEWABLE ENERGY",
        f"  Current renewable share: {dispatch.get('renewable_percentage', 'N/A')}%",
        f"  Current demand: {dispatch.get('demand_kw', 'N/A')} kW",
        "",
        f"ENVIRONMENTAL IMPACT ({savings.get('period_days', 'N/A')}-day period)",
        f"  Diesel used: {savings.get('actual_diesel_used_liters', 'N/A')} L",
        f"  Diesel saved vs. baseline: {savings.get('diesel_saved_liters', 'N/A')} L",
        f"  CO2 avoided: {savings.get('co2_avoided_kg', 'N/A')} kg",
        "",
        "=" * 50,
        f"Report generated by AI-Driven Smart Energy Management System (SIH26061)"
    ]

    report_text = "\n".join(str(line) for line in report_lines)
    return {"station": station, "report_text": report_text}

@app.get("/current-conditions")
def get_current_conditions(station: str = "bharati"):
    from datetime import datetime
    station_cfg = get_station(station)
    month = datetime.now().month
    climate = station_cfg["monthly_climate"].get(month, {"temp_c": None, "wind_ms": None})
    return {
        "station": station,
        "temp_c": climate.get("temp_c"),
        "wind_ms": climate.get("wind_ms")
    }

from pydantic import BaseModel

class CopilotQuery(BaseModel):
    station: str = "bharati"
    query: str

@app.post("/copilot")
def ask_copilot(payload: CopilotQuery):
    station_id = payload.station.lower()
    query = payload.query.strip()
    station_cfg = get_station(station_id)
    q = query.lower()

    # Fetch live database telemetry snapshot
    conn = get_connection()
    cursor = conn.cursor()

    # Latest consumption
    cursor.execute("SELECT power_kw FROM consumption WHERE station_id = ? ORDER BY timestamp DESC LIMIT 1", (station_id,))
    latest_power = cursor.fetchone()
    power_kw = latest_power["power_kw"] if latest_power else station_cfg["powerDrawKw"]

    # Latest fuel
    cursor.execute("SELECT diesel_liters_remaining, diesel_consumed_today FROM fuel WHERE station_id = ? ORDER BY timestamp DESC LIMIT 1", (station_id,))
    latest_fuel = cursor.fetchone()
    fuel_remaining = latest_fuel["diesel_liters_remaining"] if latest_fuel else station_cfg["fuelRemainingL"]
    daily_burn = latest_fuel["diesel_consumed_today"] if latest_fuel else station_cfg["dailyConsumptionL"]

    # Latest renewables
    cursor.execute("SELECT solar_kw, wind_kw FROM renewables WHERE station_id = ? ORDER BY timestamp DESC LIMIT 1", (station_id,))
    latest_renew = cursor.fetchone()
    solar_kw = latest_renew["solar_kw"] if latest_renew else 0.0
    wind_kw = latest_renew["wind_kw"] if latest_renew else 0.0

    conn.close()

    runway_days = round(fuel_remaining / daily_burn) if daily_burn > 0 else "N/A"
    anomalies = detect_anomalies(station_id)
    active_anomalies = [a for a in anomalies if a.get("severity") in ["HIGH", "CRITICAL"]]

    # Intelligence Routing
    if any(k in q for k in ["fuel", "runway", "tank", "burn", "resupply", "delay", "litres", "liter"]):
        if "delay" in q or "resupply" in q:
            reduced_runway = round(fuel_remaining / (daily_burn * 1.2)) if daily_burn > 0 else "N/A"
            reply = f"⚓ Resupply Logistics Vector for {station_cfg['name']}:\n" \
                    f"Current reserve: {fuel_remaining:,.0f} L ({runway_days} days baseline runway).\n" \
                    f"If a 30-day resupply vessel delay occurs and winter heating demand spikes burn by +20%, projected fuel runway drops to ~{reduced_runway} days. " \
                    f"Recommendation: Enable Eco-Mode heating thresholds to extend safety margin by +14 days."
        else:
            reply = f"⛽ Fuel System Telemetry for {station_cfg['name']}:\n" \
                    f"Remaining Diesel/Jet-A1: {fuel_remaining:,.0f} L of {station_cfg['fuelCapacityL']:,.0f} L capacity ({(fuel_remaining/station_cfg['fuelCapacityL'])*100:.1f}% full).\n" \
                    f"Average daily burn rate: {daily_burn:.1f} L/day.\n" \
                    f"Projected fuel runway: ~{runway_days} days. Primary supply is secure."

    elif any(k in q for k in ["solar", "wind", "renewable", "clean", "green", "battery", "soc", "dispatch"]):
        total_ren = solar_kw + wind_kw
        ren_pct = round((total_ren / power_kw) * 100, 1) if power_kw > 0 else 0
        reply = f"☀️ Renewable Dispatch Analysis for {station_cfg['name']}:\n" \
                f"Current Solar: {solar_kw:.1f} kW | Current Wind: {wind_kw:.1f} kW (Total Clean Power: {total_ren:.1f} kW).\n" \
                f"Renewable Penetration: {ren_pct}% of total {power_kw:.1f} kW demand.\n" \
                f"Recommendation: Shifting non-essential water heating to solar peak windows (11:00-14:30 UTC) will save ~120L of fuel daily."

    elif any(k in q for k in ["anomaly", "error", "vibration", "temp", "genset", "generator", "alert", "health", "breakdown"]):
        if active_anomalies:
            a = active_anomalies[0]
            reply = f"⚠️ CRITICAL EQUIPMENT ALERT on {station_cfg['name']}:\n" \
                    f"Equipment [{a.get('equipment_id')}]: Vibration deviation {a.get('vibration_deviation_from_normal')} mm/s, Temp deviation {a.get('temperature_deviation_from_normal')} °C.\n" \
                    f"IsolationForest ML Severity: {a.get('severity')}.\n" \
                    f"Action Required: Inspect bearing alignment and reduce generator load by switching to backup loop."
        else:
            reply = f"✔ Equipment Health Status for {station_cfg['name']}:\n" \
                    f"IsolationForest ML Anomaly Engine reports all 6 telemetry channels operating within nominal range. No active mechanical or thermal deviations detected."

    elif any(k in q for k in ["load", "shed", "heating", "kitchen", "dorm", "lab", "demand", "kw", "power"]):
        reply = f"⚡ Microgrid Load Analysis for {station_cfg['name']}:\n" \
                f"Current Demand: {power_kw:.1f} kW (Genset Capacity: {station_cfg['generatorCapacityKw']} kW, Utilization: {(power_kw/station_cfg['generatorCapacityKw'])*100:.1f}%).\n" \
                f"Heating Load: Life-critical (Priority Tier 0). Kitchen Water Heater: Non-critical (Priority Tier 2 - candidate for peak load shifting)."

    elif any(k in q for k in ["weather", "temp", "wind", "polar", "sun", "daylight", "night"]):
        reply = f"🌡️ Environmental Context for {station_cfg['name']} ({station_cfg['region']}):\n" \
                f"Coordinates: {station_cfg['coordinates']} | Operating Mode: {station_cfg['operatingMode'].title()}.\n" \
                f"Polar Phase: {station_cfg['polarPhase'].title()} ({station_cfg['daylightHours']} hrs daylight).\n" \
                f"Outside Temp: {station_cfg['outsideTempC']} °C | Wind Speed: {station_cfg['windSpeedMs']} m/s."

    else:
        reply = f"🤖 Polar Sentinel AI ({station_cfg['name']} Station Context):\n" \
                f"Current telemetry: {power_kw:.1f} kW power draw across {station_cfg['headcount']} personnel.\n" \
                f"Fuel Reserve: {fuel_remaining:,.0f} L ({runway_days} days runway).\n" \
                f"I can assist with fuel runway forecasting, renewable dispatch, generator anomaly diagnostics, load shedding, or weather impacts. What would you like to analyze?"

    return {
        "station": station_id,
        "query": query,
        "reply": reply,
        "timestamp": datetime.now().strftime("%H:%M UTC")
    }