import os
import sqlite3

SHIFTABLE_ZONES = {
    "Kitchen": {"shiftable": True, "reason": "Water heating can be scheduled flexibly"},
    "Labs": {"shiftable": False, "reason": "Research schedules are fixed"},
    "Heating": {"shiftable": False, "reason": "Life-critical, must run continuously"},
    "Dorms": {"shiftable": False, "reason": "Life-critical, must run continuously"}
}

DB_PATH = os.path.join(os.path.dirname(__file__), "station_data.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def find_shift_recommendations(station_id="bharati"):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT r.timestamp, r.solar_kw, r.wind_kw,
               (SELECT SUM(c.power_kw) FROM consumption c WHERE c.timestamp = r.timestamp AND c.station_id = ?) as demand_kw
        FROM renewables r
        WHERE r.station_id = ?
        ORDER BY r.timestamp DESC
        LIMIT 24
    """, (station_id, station_id))
    rows = cursor.fetchall()
    conn.close()

    surplus_windows = []
    for row in rows:
        renewable_kw = row["solar_kw"] + row["wind_kw"]
        demand_kw = row["demand_kw"] or 0
        surplus = renewable_kw - demand_kw
        if surplus > 0:
            surplus_windows.append({"timestamp": row["timestamp"], "surplus_kw": round(surplus, 2)})

    recommendations = []
    shiftable_zone_names = [z for z, info in SHIFTABLE_ZONES.items() if info["shiftable"]]

    if surplus_windows and shiftable_zone_names:
        best_window = max(surplus_windows, key=lambda x: x["surplus_kw"])
        for zone in shiftable_zone_names:
            recommendations.append({
                "zone": zone,
                "reason": SHIFTABLE_ZONES[zone]["reason"],
                "suggested_shift_to": best_window["timestamp"],
                "available_surplus_kw": best_window["surplus_kw"]
            })

    return {
        "shiftable_zones": shiftable_zone_names,
        "surplus_windows_found": len(surplus_windows),
        "recommendations": recommendations
    }


if __name__ == "__main__":
    result = find_shift_recommendations("bharati")
    print(result)