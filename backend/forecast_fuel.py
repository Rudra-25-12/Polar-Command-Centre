import sqlite3
import pandas as pd
from prophet import Prophet

def get_connection():
    conn = sqlite3.connect("station_data.db")
    return conn

def forecast_fuel_runway():
    conn = get_connection()
    df = pd.read_sql_query(
        "SELECT timestamp, diesel_liters_remaining FROM fuel ORDER BY timestamp ASC",
        conn
    )
    conn.close()

    # Prophet requires columns named exactly 'ds' (date) and 'y' (value to predict)
    df = df.rename(columns={"timestamp": "ds", "diesel_liters_remaining": "y"})
    df["ds"] = pd.to_datetime(df["ds"])

    # Create and train the model
    model = Prophet(interval_width=0.90)  # 90% confidence interval
    model.fit(df)

    # Predict 90 days into the future
    future = model.make_future_dataframe(periods=90)
    forecast = model.predict(future)

    # Find the first predicted date where fuel hits zero (or below)
    depletion_row = forecast[forecast["yhat"] <= 0].head(1)

    if not depletion_row.empty:
        depletion_date = depletion_row["ds"].values[0]
        today = pd.Timestamp.now()
        days_remaining = (pd.Timestamp(depletion_date) - today).days

        # Also get the confidence range (using the upper/lower bound predictions)
        lower_depletion = forecast[forecast["yhat_upper"] <= 0].head(1)
        upper_depletion = forecast[forecast["yhat_lower"] <= 0].head(1)

        days_lower = (pd.Timestamp(lower_depletion["ds"].values[0]) - today).days if not lower_depletion.empty else days_remaining
        days_upper = (pd.Timestamp(upper_depletion["ds"].values[0]) - today).days if not upper_depletion.empty else days_remaining

        print(f"Estimated days remaining: {days_remaining}")
        print(f"Confidence range: {min(days_lower, days_upper)} - {max(days_lower, days_upper)} days")
    else:
        print("Fuel not predicted to run out within the forecast window.")

if __name__ == "__main__":
    forecast_fuel_runway()