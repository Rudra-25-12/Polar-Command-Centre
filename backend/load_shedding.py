"""
load_shedding.py — Simple, Deterministic Safety-Tiered Load Shedding Engine

Rule-Based Control Logic for SIH 2026:
  1. Critical (Tier 1): Space Heating, Medical Fridges, Life Support — NEVER auto-shed.
  2. Important (Tier 2): Research Equipment & Scientific Labs — Requires Station Commander Approval before touching.
  3. Low Priority (Tier 3): Extra Lighting, Snow Melter & Comfort Items — Shed automatically first when supply < demand.
"""

# Explicit 3 Categories as requested for SIH 2026 judging
CATEGORIES = {
    "Critical": {
        "tier": 1,
        "items": ["Space Heating", "Medical Fridges", "Life Support Oxygen"],
        "description": "Life safety and climate control — NEVER auto-shed",
        "auto_shed": False,
    },
    "Important": {
        "tier": 2,
        "items": ["Research Equipment", "Scientific Labs", "Telemetry Arrays"],
        "description": "Scientific instruments — Requires Station Commander Approval before touching",
        "auto_shed": False,  # Commander Approval Required
    },
    "Low Priority": {
        "tier": 3,
        "items": ["Extra Lighting", "Snow Melter", "Comfort Items / Sauna"],
        "description": "Discretionary comfort loads — Shed automatically first when power runs low",
        "auto_shed": True,
    },
}


def decide_load_shedding(demand_kw: float, available_supply_kw: float):
    """
    Simple deterministic if-else load shedding rule:
    - If supply >= demand: All nominal.
    - If supply < demand:
      Step 1: Turn off Low Priority (Tier 3) items first.
      Step 2: If still not enough, WARN THE COMMANDER before touching Important (Tier 2) items.
      Step 3: Always require manual 'Approve / Override' button for Station Commander for Tier 2/1.
    """
    if available_supply_kw >= demand_kw:
        return {
            "shedding_required": False,
            "shortfall_kw": 0.0,
            "status": "nominal",
            "message": "Power supply meets or exceeds demand. All systems nominal.",
            "auto_shed_zones": [],
            "pending_commander_approval_zones": [],
            "requires_commander_approval": False,
            "categories": CATEGORIES,
        }

    shortfall_kw = round(demand_kw - available_supply_kw, 2)

    # Estimate capacity per tier based on realistic load splits
    low_priority_capacity_kw = round(demand_kw * 0.25, 2)   # ~25% load (snow melter, extra lighting)
    important_capacity_kw = round(demand_kw * 0.35, 2)      # ~35% load (research equipment, labs)
    critical_capacity_kw = round(demand_kw * 0.40, 2)       # ~40% load (heating, medical fridges)

    # Step 1: Shut off Low Priority items first
    low_priority_shed = min(shortfall_kw, low_priority_capacity_kw)
    remaining_shortfall = round(shortfall_kw - low_priority_shed, 2)

    auto_shed_zones = [
        {
            "category": "Low Priority",
            "tier": 3,
            "kw_shed": low_priority_shed,
            "items": CATEGORIES["Low Priority"]["items"],
            "status": "AUTOMATICALLY SHUT OFF",
        }
    ]

    # Step 2 & 3: Check if shortfall exceeds Low Priority capacity
    if remaining_shortfall <= 0:
        return {
            "shedding_required": True,
            "shortfall_kw": shortfall_kw,
            "remaining_shortfall_kw": 0.0,
            "status": "low_priority_shed",
            "message": f"Power deficit of {shortfall_kw} kW detected. Low Priority items (extra lighting, comfort items) shut off automatically. Critical & Important systems protected.",
            "auto_shed_zones": auto_shed_zones,
            "pending_commander_approval_zones": [],
            "requires_commander_approval": False,
            "categories": CATEGORIES,
        }

    # If still not enough power, WARN COMMANDER before touching Important (Tier 2) items
    pending_commander_approval_zones = [
        {
            "category": "Important",
            "tier": 2,
            "kw_required": remaining_shortfall,
            "items": CATEGORIES["Important"]["items"],
            "status": "AWAITING COMMANDER APPROVAL",
            "warning": "Power deficit exceeds Low Priority capacity. Approve shedding Research Equipment or execute manual override.",
        }
    ]

    return {
        "shedding_required": True,
        "shortfall_kw": shortfall_kw,
        "remaining_shortfall_kw": remaining_shortfall,
        "status": "commander_warning",
        "message": f"CRITICAL WARNING: Power deficit ({shortfall_kw} kW) exceeds Low Priority capacity. Low Priority items shut off automatically ({low_priority_shed} kW). Station Commander approval required before shedding Important items ({remaining_shortfall} kW).",
        "auto_shed_zones": auto_shed_zones,
        "pending_commander_approval_zones": pending_commander_approval_zones,
        "requires_commander_approval": True,
        "categories": CATEGORIES,
    }


if __name__ == "__main__":
    print("Scenario 1: Supply meets demand (120 kW vs 120 kW)")
    print(decide_load_shedding(120, 120))

    print("\nScenario 2: Small shortfall covered by Low Priority (120 kW demand, 100 kW supply)")
    print(decide_load_shedding(120, 100))

    print("\nScenario 3: Severe shortfall requiring Commander Warning (120 kW demand, 60 kW supply)")
    print(decide_load_shedding(120, 60))