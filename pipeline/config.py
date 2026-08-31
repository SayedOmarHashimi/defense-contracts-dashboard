"""Configuration for the Defense Contracts Dashboard ingestion pipeline."""

API_BASE = "https://api.usaspending.gov/api/v2"

# Prime contract award types (FPDS): BPA Call, Purchase Order,
# Delivery Order, Definitive Contract. Excludes IDVs, grants, loans.
AWARD_TYPE_CODES = ["A", "B", "C", "D"]

AWARDING_AGENCY = {"type": "awarding", "tier": "toptier", "name": "Department of Defense"}

# Federal fiscal years: FY ends Sept 30. FY2020 starts 2019-10-01.
FY_START, FY_END = 2020, 2025

# Number of contractors on the leaderboard.
TOP_N = 100

# Awarding sub-agency rows to request per contractor. DoD has ~30 reporting
# sub-agencies; requesting well above that avoids silently truncating the
# breakdown for diversified resellers.
AGENCY_LIMIT = 100

# UEI registrations to pull before merging. Several UEIs can belong to one
# company, so the raw pull is oversized to still land ~TOP_N after merging.
FETCH_N = 150

# FPDS extent-of-competition codes.
#   A  Full and Open Competition
#   D  Full and Open Competition after exclusion of sources
#   F  Competed under Simplified Acquisition Procedures
#   CDO Competitive Delivery Order
COMPETED_CODES = ["A", "D", "F", "CDO"]
#   B  Not Available for Competition
#   C  Not Competed
#   E  Follow On to Competed Action
#   G  Not Competed under Simplified Acquisition Procedures
#   NDO Non-Competitive Delivery Order
NOT_COMPETED_CODES = ["B", "C", "E", "G", "NDO"]

# Politeness / resilience when talking to the public API.
MAX_WORKERS = 3
MAX_RETRIES = 6
TIMEOUT_SECONDS = 120


def fiscal_year_window(start_fy: int = FY_START, end_fy: int = FY_END) -> list[dict]:
    return [{"start_date": f"{start_fy - 1}-10-01", "end_date": f"{end_fy}-09-30"}]


def base_filters(**extra) -> dict:
    filters = {
        "time_period": fiscal_year_window(),
        "agencies": [AWARDING_AGENCY],
        "award_type_codes": AWARD_TYPE_CODES,
    }
    filters.update(extra)
    return filters
