# Priority tiers: lower tier number = more critical, shed last
PRIORITY_TIERS = {
    "Heating": 1,   # Critical - life support
    "Dorms": 1,     # Critical - life support (basic living conditions)
    "Labs": 2,      # Important - research equipment
    "Kitchen": 3,   # Low priority - comfort/non-essential
}

TIER_NAMES = {
    1: "Critical",
    2: "Important",
    3: "Low"
}


def decide_load_shedding(demand_kw, available_supply_kw):
    """
    Given total demand and what's actually available (renewables + battery + diesel),
    decide which zones to shed (turn off) if supply can't meet demand.
    Sheds lowest-priority (Tier 3) first, then Tier 2, protecting Tier 1 always.
    """
    if available_supply_kw >= demand_kw:
        return {
            "shedding_required": False,
            "message": "Supply meets demand, no shedding needed",
            "shed_zones": []
        }

    shortfall = demand_kw - available_supply_kw
    shed_zones = []

    # Sort zones by tier, highest tier number (least critical) first
    zones_by_priority = sorted(PRIORITY_TIERS.items(), key=lambda x: -x[1])

    # Assume roughly equal load per zone for this simple version
    estimated_load_per_zone = demand_kw / len(PRIORITY_TIERS)

    remaining_shortfall = shortfall
    for zone, tier in zones_by_priority:
        if remaining_shortfall <= 0:
            break
        if tier == 1:
            # Never auto-shed Tier 1 (Critical) - always requires human decision
            continue

        shed_zones.append({"zone": zone, "tier": tier, "tier_name": TIER_NAMES[tier]})
        remaining_shortfall -= estimated_load_per_zone

    requires_manual_approval = remaining_shortfall > 0  # if shedding Tier 2/3 wasn't enough

    return {
        "shedding_required": True,
        "shortfall_kw": round(shortfall, 2),
        "shed_zones": shed_zones,
        "requires_manual_approval_for_critical": requires_manual_approval,
        "message": "Critical loads at risk - manual approval needed" if requires_manual_approval else "Shedding non-critical zones automatically"
    }


if __name__ == "__main__":
    print("Scenario 1: Small shortfall")
    print(decide_load_shedding(demand_kw=16, available_supply_kw=14))

    print("\nScenario 2: Severe shortfall")
    print(decide_load_shedding(demand_kw=16, available_supply_kw=5))

    print("\nScenario 3: No shortfall")
    print(decide_load_shedding(demand_kw=16, available_supply_kw=20))