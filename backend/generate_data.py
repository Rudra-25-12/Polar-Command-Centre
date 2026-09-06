import sqlite3
import random
from datetime import datetime, timedelta, timezone
from astral import LocationInfo, sun
from station_config import get_station, DIESEL_TO_POWER_L_PER_KWH

def get_connection():
    return sqlite3.connect("station_data.db")


def get_daylight_window(station_id, check_date):
    """Returns (sunrise_hour, sunset_hour) or ('polar_day', None) or ('polar_night', None)
    for the given station's real coordinates."""
    station = get_station(station_id)
    loc = LocationInfo(
        name=station["name"], region=station["region"], timezone="UTC",
        latitude=station["latitude"], longitude=station["longitude"]
    )
    try:
        s = sun.sun(loc.observer, date=check_date, tzinfo=loc.timezone)
        return (s["sunrise"].hour, s["sunset"].hour)
    except ValueError:
        noon = datetime(check_date.year, check_date.month, check_date.day, 12, 0, tzinfo=timezone.utc)
        elevation = sun.elevation(loc.observer, noon)
        return ("polar_day", None) if elevation > 0 else ("polar_night", None)


def generate_consumption_data(station_id="bharati", days=7):
    """Generates realistic zone-wise power consumption, driven by real monthly temperature
    (colder months = more heating load) and real personnel counts (scales overall demand)."""
    station = get_station(station_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM consumption WHERE station_id = ?", (station_id,))

    personnel = station["personnel_winter_typical"]
    scale = personnel / 22.0
    zones = {
        "Heating": (4.0 * scale, 7.0 * scale),
        "Labs": (2.0 * scale, 4.5 * scale),
        "Kitchen": (1.0 * scale, 3.0 * scale),
        "Dorms": (1.5 * scale, 3.5 * scale),
    }

    now = datetime.now()
    start_time = now - timedelta(days=days)
    current_time = start_time

    while current_time <= now:
        month = current_time.month
        climate = station["monthly_climate"].get(month, {"temp_c": -10})
        temp_c = climate["temp_c"] if climate["temp_c"] is not None else -10

        heating_multiplier = 1.0 + max(0, (-temp_c) / 40.0)

        for zone, (min_kw, max_kw) in zones.items():
            base_power = random.uniform(min_kw, max_kw)
            if zone == "Heating":
                base_power *= heating_multiplier
            cursor.execute(
                "INSERT INTO consumption (station_id, timestamp, zone, power_kw) VALUES (?, ?, ?, ?)",
                (station_id, current_time.isoformat(), zone, round(base_power, 2))
            )
        current_time += timedelta(hours=1)

    conn.commit()
    conn.close()
    print(f"Consumption data generated for {station['name']} (real climate-calibrated).")


def generate_fuel_data(station_id="bharati", days_of_history=90):
    """Generates realistic fuel depletion using each station's REAL annual fuel range."""
    station = get_station(station_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM fuel WHERE station_id = ?", (station_id,))

    annual_low, annual_high = station["annual_fuel_l_range"]
    if annual_low is None:
        conn.close()
        print(f"No fuel system applicable for {station['name']} (shares external infrastructure).")
        return

    daily_low = annual_low / 365.0
    daily_high = annual_high / 365.0

    starting_fuel = station["fuel_farm_capacity_l"] or (station["annual_fuel_l_typical"] * 1.3)

    now = datetime.now()
    start_time = now - timedelta(days=days_of_history)
    current_time = start_time
    remaining = starting_fuel

    while current_time <= now:
        daily_usage = random.uniform(daily_low, daily_high)
        remaining = max(0, remaining - daily_usage)
        cursor.execute(
            "INSERT INTO fuel (station_id, timestamp, diesel_liters_remaining, diesel_consumed_today) VALUES (?, ?, ?, ?)",
            (station_id, current_time.isoformat(), round(remaining, 1), round(daily_usage, 1))
        )
        current_time += timedelta(days=1)

    conn.commit()
    conn.close()
    print(f"Fuel data generated for {station['name']} (real annual range: {annual_low:,.0f}-{annual_high:,.0f} L/year).")


def generate_renewable_data(station_id="bharati", days=7):
    """Generates renewable output using REAL astronomical daylight combined with
    REAL monthly wind-speed averages."""
    station = get_station(station_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM renewables WHERE station_id = ?", (station_id,))

    now = datetime.now()
    start_time = now - timedelta(days=days)
    current_time = start_time

    while current_time <= now:
        hour = current_time.hour
        month = current_time.month
        window = get_daylight_window(station_id, current_time.date())

        if window[0] == "polar_day":
            is_daylight = True
        elif window[0] == "polar_night":
            is_daylight = False
        else:
            sunrise_hour, sunset_hour = window
            is_daylight = sunrise_hour <= hour <= sunset_hour

        peak_solar = station.get("solar_radiation_peak_summer_mj", 2.5)
        solar_kw = random.uniform(peak_solar * 0.5, peak_solar) if is_daylight else 0.0

        climate = station["monthly_climate"].get(month, {"wind_ms": 6.0})
        avg_wind_ms = climate.get("wind_ms") or 6.0
        wind_speed_ms = max(0, random.uniform(avg_wind_ms * 0.7, avg_wind_ms * 1.3))
        wind_kw = min(6.0, 0.007 * (wind_speed_ms ** 3))

        cursor.execute(
            "INSERT INTO renewables (station_id, timestamp, solar_kw, wind_kw) VALUES (?, ?, ?, ?)",
            (station_id, current_time.isoformat(), round(solar_kw, 2), round(wind_kw, 2))
        )
        current_time += timedelta(hours=1)

    conn.commit()
    conn.close()
    print(f"Renewable data generated for {station['name']} (real wind-speed + polar-night-aware solar).")


def generate_all_for_station(station_id):
    generate_consumption_data(station_id)
    generate_fuel_data(station_id)
    generate_renewable_data(station_id)


if __name__ == "__main__":
    for sid in ["bharati", "maitri", "himadri"]:
        generate_all_for_station(sid)