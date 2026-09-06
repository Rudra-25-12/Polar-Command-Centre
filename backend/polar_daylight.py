from astral import LocationInfo, sun
from datetime import date, datetime, timezone

station = LocationInfo(
    name="Bharati",
    region="Antarctica",
    timezone="UTC",
    latitude=-69.4,
    longitude=76.2
)

def get_daylight_hours(check_date):
    try:
        s = sun.sun(station.observer, date=check_date, tzinfo=station.timezone)
        sunrise = s["sunrise"]
        sunset = s["sunset"]
        daylight_duration = (sunset - sunrise).total_seconds() / 3600
        return round(daylight_duration, 2)
    except ValueError:
        noon = datetime(check_date.year, check_date.month, check_date.day, 12, 0, tzinfo=timezone.utc)
        elevation = sun.elevation(station.observer, noon)
        if elevation > 0:
            return 24.0
        else:
            return 0.0

if __name__ == "__main__":
    test_dates = [date(2026, 6, 21), date(2026, 9, 21), date(2026, 12, 21), date(2026, 3, 21)]
    for d in test_dates:
        hours = get_daylight_hours(d)
        print(f"{d}: {hours} hours of daylight")