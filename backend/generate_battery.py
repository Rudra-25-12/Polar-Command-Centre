import os
import sqlite3
from station_config import get_station

DB_PATH = os.path.join(os.path.dirname(__file__), "station_data.db")

def get_connection():
    return sqlite3.connect(DB_PATH)

def generate_battery_data(station_id="bharati"):
    station = get_station(station_id)
    if not station["standalone_microgrid"]:
        print(f"No independent battery system modeled for {station['name']} (shares external infrastructure).")
        return

    max_capacity_kwh = 20.0 if station_id == "bharati" else 25.0

    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("DELETE FROM battery WHERE station_id = ?", (station_id,))

    cursor.execute("""
        SELECT r.timestamp, r.solar_kw, r.wind_kw,
               (SELECT SUM(c.power_kw) FROM consumption c WHERE c.timestamp = r.timestamp AND c.station_id = ?) as demand_kw
        FROM renewables r
        WHERE r.station_id = ?
        ORDER BY r.timestamp ASC
    """, (station_id, station_id))
    rows = cursor.fetchall()

    charge_kwh = max_capacity_kwh / 2

    for row in rows:
        renewable_kw = row["solar_kw"] + row["wind_kw"]
        demand_kw = row["demand_kw"] or 0
        surplus = renewable_kw - demand_kw

        if surplus > 0:
            charge_kwh = min(max_capacity_kwh, charge_kwh + surplus)
        else:
            charge_kwh = max(0, charge_kwh + surplus)

        cursor.execute(
            "INSERT INTO battery (station_id, timestamp, charge_kwh) VALUES (?, ?, ?)",
            (station_id, row["timestamp"], round(charge_kwh, 2))
        )

    conn.commit()
    conn.close()
    print(f"Battery simulation generated for {station['name']} (ESTIMATE capacity: {max_capacity_kwh} kWh).")

if __name__ == "__main__":
    for sid in ["bharati", "maitri", "himadri"]:
        generate_battery_data(sid)