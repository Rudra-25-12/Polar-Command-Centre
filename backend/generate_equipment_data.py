import sqlite3
import random
from datetime import datetime, timedelta
from station_config import get_station

def get_connection():
    return sqlite3.connect("station_data.db")

def generate_equipment_data(station_id="bharati"):
    station = get_station(station_id)

    if station_id == "bharati":
        equipment_ids = ["CHP-Unit-1", "CHP-Unit-2", "CHP-Unit-3"]
    elif station_id == "maitri":
        equipment_ids = ["Generator-A", "Generator-B"]
    else:
        print(f"No independent generation equipment modeled for {station['name']} (shares external infrastructure).")
        return

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM equipment_sensors WHERE station_id = ?", (station_id,))

    now = datetime.now()
    start_time = now - timedelta(days=30)
    total_hours = 30 * 24

    fault_equipment = equipment_ids[-1]

    for equipment in equipment_ids:
        current_time = start_time
        hour_index = 0
        normal_vibration_range = (0.5, 1.5)
        normal_temperature_range = (60, 75)

        while current_time <= now:
            vibration = random.uniform(*normal_vibration_range)
            temperature = random.uniform(*normal_temperature_range)

            if equipment == fault_equipment and hour_index > (total_hours - 5 * 24):
                progress = (hour_index - (total_hours - 5 * 24)) / (5 * 24)
                vibration += progress * 3.0
                temperature += progress * 15.0

            cursor.execute(
                "INSERT INTO equipment_sensors (station_id, timestamp, equipment_id, vibration, temperature) VALUES (?, ?, ?, ?, ?)",
                (station_id, current_time.isoformat(), equipment, round(vibration, 2), round(temperature, 2))
            )
            current_time += timedelta(hours=1)
            hour_index += 1

    conn.commit()
    conn.close()
    print(f"Equipment sensor data generated for {station['name']} (fault injected in {fault_equipment}).")

if __name__ == "__main__":
    for sid in ["bharati", "maitri"]:
        generate_equipment_data(sid)