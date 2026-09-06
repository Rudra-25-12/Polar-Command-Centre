import sqlite3
import pandas as pd
from sklearn.ensemble import IsolationForest

def get_connection():
    return sqlite3.connect("station_data.db")

def detect_anomalies(station_id="bharati"):
    conn = get_connection()
    df = pd.read_sql_query(
        "SELECT timestamp, equipment_id, vibration, temperature FROM equipment_sensors WHERE station_id = ? ORDER BY timestamp ASC",
        conn, params=(station_id,)
    )
    conn.close()

    if df.empty:
        return [{"message": f"No equipment sensor data available for {station_id}"}]

    results = []

    for equipment in df["equipment_id"].unique():
        equipment_df = df[df["equipment_id"] == equipment].copy()
        features = equipment_df[["vibration", "temperature"]]

        model = IsolationForest(contamination=0.05, random_state=42)
        equipment_df["anomaly"] = model.fit_predict(features)

        anomalies = equipment_df[equipment_df["anomaly"] == -1]

        if not anomalies.empty:
            latest_anomaly = anomalies.iloc[-1]
            normal_vibration_avg = equipment_df["vibration"].median()
            normal_temp_avg = equipment_df["temperature"].median()
            vibration_deviation = round(float(latest_anomaly["vibration"] - normal_vibration_avg), 2)
            temp_deviation = round(float(latest_anomaly["temperature"] - normal_temp_avg), 2)

            severity = "HIGH" if vibration_deviation > 2 or temp_deviation > 10 else "LOW"

            results.append({
                "equipment_id": equipment,
                "latest_anomaly_time": latest_anomaly["timestamp"],
                "latest_vibration": round(float(latest_anomaly["vibration"]), 2),
                "latest_temperature": round(float(latest_anomaly["temperature"]), 2),
                "vibration_deviation_from_normal": vibration_deviation,
                "temperature_deviation_from_normal": temp_deviation,
                "severity": severity
            })
        else:
            results.append({"equipment_id": equipment, "severity": "NORMAL"})

    return results


if __name__ == "__main__":
    results = detect_anomalies("bharati")
    for r in results:
        print(r)