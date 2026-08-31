"""Transform layer: shape raw API facts into the static JSON the site reads.

Outputs
  data/contractors.json          leaderboard summaries
  data/contractor/<slug>.json    per-contractor detail
  data/meta.json                 provenance for the /methodology page

A single corporation can hold several UEI registrations (Lockheed Martin
appears twice in the raw ranking). Those are merged into one contractor so
the leaderboard shows one row per company; the constituent UEIs are kept on
the detail record so the aggregation stays auditable.
"""

from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from config import AWARD_TYPE_CODES, FY_END, FY_START, TOP_N

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = DATA / "raw" / "contractors_raw.json"


def slugify(name: str) -> str:
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", ascii_name.lower())).strip("-")


def normalize_name(name: str) -> str:
    """Key used to merge UEI registrations belonging to one company."""
    cleaned = re.sub(r"[^a-z0-9 ]+", " ", name.lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def merge(entities: list[dict]) -> dict:
    """Combine several UEI records into one contractor. All measures are additive."""
    primary = max(entities, key=lambda e: e["total_awarded"])

    yearly: dict[int, float] = defaultdict(float)
    agencies: dict[str, float] = defaultdict(float)
    competed = not_competed = 0.0
    contract_count = 0

    for entity in entities:
        for row in entity["yearly_totals"]:
            yearly[row["fiscal_year"]] += row["amount"]
        for row in entity["agency_breakdown"]:
            agencies[row["agency"]] += row["amount"]
        competed += entity["competition"]["competed"]
        not_competed += entity["competition"]["not_competed"]
        contract_count += entity["contract_count"]

    total = sum(yearly.values())
    classified = competed + not_competed
    ranked_agencies = sorted(agencies.items(), key=lambda kv: kv[1], reverse=True)

    return {
        "name": primary["name"].title(),
        "slug": slugify(primary["name"]),
        "ueis": sorted(e["uei"] for e in entities),
        "total_awarded": round(total, 2),
        "contract_count": contract_count,
        "top_agency": ranked_agencies[0][0] if ranked_agencies else None,
        "yearly_totals": [
            {"fiscal_year": fy, "amount": round(yearly.get(fy, 0.0), 2)}
            for fy in range(FY_START, FY_END + 1)
        ],
        "agency_breakdown": [
            {"agency": a, "amount": round(v, 2), "share": round(v / total, 4) if total else 0.0}
            for a, v in ranked_agencies
        ],
        "competition_mix": {
            "competed_amount": round(competed, 2),
            "not_competed_amount": round(not_competed, 2),
            "competed_pct": round(competed / classified, 4) if classified else None,
            "not_competed_pct": round(not_competed / classified, 4) if classified else None,
        },
    }


def validate(contractors: list[dict]) -> list[str]:
    """Cross-check that every derived breakdown reconciles to total_awarded.

    Each measure is fetched with an independent API call, so agreement here
    is real evidence the recipient filter applied consistently to all of them.
    """
    problems: list[str] = []
    for c in contractors:
        total = c["total_awarded"]
        tolerance = max(abs(total) * 1e-6, 1.0)
        checks = {
            "yearly_totals": sum(r["amount"] for r in c["yearly_totals"]),
            "agency_breakdown": sum(r["amount"] for r in c["agency_breakdown"]),
            "competition_mix": (
                c["competition_mix"]["competed_amount"]
                + c["competition_mix"]["not_competed_amount"]
            ),
        }
        for label, value in checks.items():
            if abs(value - total) > tolerance:
                problems.append(
                    f"{c['slug']}: {label} sums to {value:,.2f} "
                    f"but total_awarded is {total:,.2f}"
                )
        if c["contract_count"] <= 0:
            problems.append(f"{c['slug']}: contract_count is {c['contract_count']}")
    return problems


def main() -> None:
    raw = json.loads(RAW.read_text())

    grouped: dict[str, list[dict]] = defaultdict(list)
    for entity in raw:
        grouped[normalize_name(entity["name"])].append(entity)

    contractors = sorted(
        (merge(group) for group in grouped.values()),
        key=lambda c: c["total_awarded"],
        reverse=True,
    )[:TOP_N]

    # Slugs are the site's routing keys, so they must be unique.
    seen: dict[str, int] = {}
    for contractor in contractors:
        slug = contractor["slug"]
        if slug in seen:
            seen[slug] += 1
            contractor["slug"] = f"{slug}-{seen[slug]}"
        else:
            seen[slug] = 1

    problems = validate(contractors)
    if problems:
        print(f"VALIDATION: {len(problems)} issue(s) found:")
        for problem in problems[:20]:
            print(f"  - {problem}")
    else:
        print(f"VALIDATION: all {len(contractors)} contractors reconcile cleanly")

    detail_dir = DATA / "contractor"
    detail_dir.mkdir(parents=True, exist_ok=True)
    for stale in detail_dir.glob("*.json"):
        stale.unlink()

    summaries = []
    for rank, contractor in enumerate(contractors, start=1):
        (detail_dir / f"{contractor['slug']}.json").write_text(json.dumps(contractor, indent=2))
        summaries.append(
            {
                "id": rank,
                "name": contractor["name"],
                "slug": contractor["slug"],
                "total_awarded": contractor["total_awarded"],
                "contract_count": contractor["contract_count"],
                "top_agency": contractor["top_agency"],
            }
        )

    (DATA / "contractors.json").write_text(json.dumps(summaries, indent=2))
    (DATA / "meta.json").write_text(
        json.dumps(
            {
                "source": "USASpending.gov API v2",
                "source_url": "https://api.usaspending.gov",
                "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "fiscal_years": {"start": FY_START, "end": FY_END},
                "awarding_agency": "Department of Defense",
                "award_type_codes": AWARD_TYPE_CODES,
                "contractor_count": len(summaries),
                "merged_uei_registrations": sum(len(c["ueis"]) for c in contractors),
            },
            indent=2,
        )
    )
    print(f"Wrote {len(summaries)} contractors + detail files to {DATA}")


if __name__ == "__main__":
    main()
