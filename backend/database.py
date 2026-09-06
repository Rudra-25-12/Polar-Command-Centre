import sqlite3

def get_connection():
    conn = sqlite3.connect("station_data.db")
    return conn

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS consumption (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT NOT NULL DEFAULT 'bharati',
            timestamp TEXT NOT NULL,
            zone TEXT NOT NULL,
            power_kw REAL NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fuel (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT NOT NULL DEFAULT 'bharati',
            timestamp TEXT NOT NULL,
            diesel_liters_remaining REAL NOT NULL,
            diesel_consumed_today REAL NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS renewables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT NOT NULL DEFAULT 'bharati',
            timestamp TEXT NOT NULL,
            solar_kw REAL NOT NULL,
            wind_kw REAL NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS battery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT NOT NULL DEFAULT 'bharati',
            timestamp TEXT NOT NULL,
            charge_kwh REAL NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS equipment_sensors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT NOT NULL DEFAULT 'bharati',
            timestamp TEXT NOT NULL,
            equipment_id TEXT NOT NULL,
            vibration REAL NOT NULL,
            temperature REAL NOT NULL
        )
    """)

    conn.commit()
    conn.close()
    print("Tables created successfully (with station_id support).")

if __name__ == "__main__":
    create_tables()