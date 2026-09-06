def calculate_dispatch(demand_kw, solar_kw, wind_kw, battery_available_kw):
    """
    Decides how much power comes from renewables, battery, and diesel
    for a single hour, given the demand and what's available.
    Priority order: renewables first, then battery, then diesel.
    """
    renewable_available = solar_kw + wind_kw

    # Step 1: Use renewables first
    from_renewables = min(demand_kw, renewable_available)
    remaining_demand = demand_kw - from_renewables

    # Step 2: Use battery for whatever renewables couldn't cover
    from_battery = min(remaining_demand, battery_available_kw)
    remaining_demand -= from_battery

    # Step 3: Whatever's left comes from diesel
    from_diesel = remaining_demand

    return {
        "demand_kw": demand_kw,
        "from_renewables": round(from_renewables, 2),
        "from_battery": round(from_battery, 2),
        "from_diesel": round(from_diesel, 2),
        "renewable_percentage": round((from_renewables / demand_kw) * 100, 1) if demand_kw > 0 else 0
    }


if __name__ == "__main__":
    # Test with a few example scenarios
    print("Scenario 1: Good renewable conditions")
    print(calculate_dispatch(demand_kw=10, solar_kw=3, wind_kw=2, battery_available_kw=3))

    print("\nScenario 2: Polar night, low wind")
    print(calculate_dispatch(demand_kw=10, solar_kw=0, wind_kw=1, battery_available_kw=2))

    print("\nScenario 3: Excellent conditions, renewables cover everything")
    print(calculate_dispatch(demand_kw=5, solar_kw=4, wind_kw=3, battery_available_kw=2))