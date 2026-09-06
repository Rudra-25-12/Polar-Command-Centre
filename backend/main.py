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

def get_connection():
    conn = sqlite3.connect("station_data.db")
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
    conn = sqlite3.connect("station_data.db")
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

    conn = sqlite3.connect("station_data.db")
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