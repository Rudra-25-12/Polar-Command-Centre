"""
station_config.py

Central configuration for all three Indian polar stations.
Every numeric value below is either:
  - REAL   : a verified figure from an NCPOR/NCAOR Annual Report or official page
  - ESTIMATE: derived/calculated, clearly labeled, not an official published figure
See NCPOR_Consolidated_Data_Reference.docx for full sourcing and citations.
"""

STATIONS = {

    "bharati": {
        "name": "Bharati",
        "region": "Antarctica",
        "latitude": -69.4068,      # 69°24.41'S -- REAL, NCPOR official
        "longitude": 76.1953,      # 76°11.72'E -- REAL, NCPOR official
        "commissioned_year": 2012,
        "standalone_microgrid": True,

        "personnel_winter_range": [19, 24],
        "personnel_winter_typical": 22,
        "personnel_max_capacity_winter": 47,
        "personnel_max_capacity_summer": 72,

        "generation_type": "3 x 100 kVA CHP (Combined Heat and Power) units",
        "installed_capacity_kva": 300,
        "installed_capacity_kw_estimate": 260,
        "generation_capacity_source": "verified",

        "fuel_type": "Jet A1 (aviation-grade fuel)",
        "annual_fuel_l_range": [240000, 300000],
        "annual_fuel_l_typical": 265000,
        "fuel_farm_capacity_l": 300000,
        "fuel_requirement_source": "estimate",

        "monthly_climate": {
            1: {"temp_c": 0.14, "wind_ms": 5.66},
            2: {"temp_c": -3.54, "wind_ms": 6.81},
            3: {"temp_c": -9.80, "wind_ms": 6.82},
            4: {"temp_c": -13.56, "wind_ms": 6.53},
            5: {"temp_c": -16.16, "wind_ms": 6.26},
            6: {"temp_c": -15.60, "wind_ms": 7.09},
            7: {"temp_c": -16.98, "wind_ms": 6.60},
            8: {"temp_c": -15.42, "wind_ms": 7.54},
            9: {"temp_c": -14.66, "wind_ms": 7.54},
            10: {"temp_c": -10.72, "wind_ms": 7.38},
            11: {"temp_c": -4.94, "wind_ms": 6.42},
            12: {"temp_c": -0.06, "wind_ms": 4.08},
        },
    },

    "maitri": {
        "name": "Maitri",
        "region": "Antarctica",
        "latitude": -70.7644,      # 70°45'52"S -- REAL, resolved from NCPOR NPDC page
        "longitude": 11.7342,      # 11°44'03"E -- REAL
        "commissioned_year": 1989,
        "standalone_microgrid": True,

        "personnel_winter_range": [21, 25],
        "personnel_winter_typical": 24,
        "personnel_max_capacity_winter": None,
        "personnel_max_capacity_summer": 65,

        "generation_type": "Not publicly disclosed",
        "installed_capacity_kva": None,
        "installed_capacity_kw_estimate": None,
        "generation_capacity_source": "not_publicly_available",

        "fuel_type": "Jet A1 / Aviation Turbine Fuel (ATF)",
        "annual_fuel_l_range": [349000, 387000],
        "annual_fuel_l_typical": 370000,
        "annual_fuel_requirement_l_official": 320000,
        "fuel_farm_capacity_l": None,
        "fuel_requirement_source": "official_stated",
        "crisis_multiplier": 1.75,

        "monthly_climate": {
            1: {"temp_c": -0.89, "wind_ms": 9.00},
            2: {"temp_c": -3.95, "wind_ms": 10.22},
            3: {"temp_c": -8.44, "wind_ms": 10.95},
            4: {"temp_c": -12.70, "wind_ms": 11.33},
            5: {"temp_c": -14.74, "wind_ms": 11.07},
            6: {"temp_c": -15.54, "wind_ms": 11.30},
            7: {"temp_c": -17.89, "wind_ms": 10.74},
            8: {"temp_c": -18.31, "wind_ms": 10.58},
            9: {"temp_c": -17.21, "wind_ms": 9.66},
            10: {"temp_c": -12.85, "wind_ms": 10.07},
            11: {"temp_c": -5.79, "wind_ms": 10.37},
            12: {"temp_c": -1.29, "wind_ms": 8.62},
        },
        "solar_radiation_peak_summer_mj": 2.7,
        "solar_radiation_peak_winter_mj": 0.15,
    },

    "himadri": {
        "name": "Himadri",
        "region": "Arctic",
        "latitude": 78.9170,
        "longitude": 11.9330,
        "commissioned_year": 2008,
        "standalone_microgrid": False,

        "personnel_winter_range": [8, 8],
        "personnel_winter_typical": 8,
        "personnel_max_capacity_winter": 8,
        "personnel_max_capacity_summer": 8,
        "operating_days_per_year": 180,

        "generation_type": "Not applicable -- draws on shared Ny-Alesund/Kings Bay AS infrastructure",
        "installed_capacity_kva": None,
        "installed_capacity_kw_estimate": None,
        "generation_capacity_source": "not_applicable",
        "fuel_type": "Not applicable",
        "annual_fuel_l_range": [None, None],
        "annual_fuel_l_typical": None,
        "fuel_farm_capacity_l": None,
        "fuel_requirement_source": "not_applicable",

        "monthly_climate": {
            1: {"temp_c": -10.67, "wind_ms": None},
            2: {"temp_c": -18.07, "wind_ms": None},
            3: {"temp_c": -21.39, "wind_ms": None},
            4: {"temp_c": -18.75, "wind_ms": None},
            5: {"temp_c": 2.78, "wind_ms": None},
            6: {"temp_c": 4.71, "wind_ms": None},
            7: {"temp_c": 9.50, "wind_ms": None},
            8: {"temp_c": 7.26, "wind_ms": None},
            9: {"temp_c": 3.55, "wind_ms": None},
            10: {"temp_c": 1.83, "wind_ms": None},
            11: {"temp_c": 1.86, "wind_ms": None},
            12: {"temp_c": -7.51, "wind_ms": None},
        },
        "climate_data_caveat": "Approximate proxy from atmospheric radiometer (surface-level brightness temperature), not a dedicated surface air-temperature sensor. Northern Hemisphere seasonal pattern (opposite of Bharati/Maitri) confirmed.",
    },
}

DIESEL_TO_POWER_L_PER_KWH = 0.238
CO2_KG_PER_LITRE_FUEL = 2.68


def get_station(station_id):
    return STATIONS.get(station_id.lower(), STATIONS["bharati"])


def get_climate_for_month(station_id, month):
    station = get_station(station_id)
    return station["monthly_climate"].get(month, {"temp_c": None, "wind_ms": None})