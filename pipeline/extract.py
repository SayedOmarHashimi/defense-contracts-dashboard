"""Extract layer: pull raw DoD prime-contract facts from USASpending.gov.

Writes an untouched snapshot of every API response to data/raw/ so the
transform step is reproducible without re-hitting the network.

Recipients are filtered by UEI via `recipient_search_text`. This matters:
the `recipient_id` filter is silently ignored by the award-level
endpoints, which would give every contractor an identical, agency-wide
contract count.
"""

from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from client import post, paginate
from config import (
    COMPETED_CODES,
    FETCH_N,
    FY_END,
    FY_START,
    MAX_WORKERS,
    NOT_COMPETED_CODES,
    base_filters,
)

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
OUT = RAW_DIR / "contractors_raw.json"
CHECKPOINT = RAW_DIR / "_checkpoint.json"


def fetch_top_recipients(limit: int = FETCH_N) -> list[dict]:
    """Rank DoD prime-contract recipients by total obligations."""
    rows = paginate(
        "/search/spending_by_category/recipient/",
        {"category": "recipient", "filters": base_filters(), "limit": 100},
        page_limit=(limit // 100) + 1,
    )
    ranked = [r for r in rows if r.get("uei")][:limit]
    return [
        {
            "name": r["name"],
            "uei": r["uei"],
            "recipient_id": r.get("recipient_id"),
            "total_awarded": r["amount"],
        }
        for r in ranked
    ]


def _by_uei(uei: str, **extra) -> dict:
    return base_filters(recipient_search_text=[uei], **extra)


def _sum_over_time(filters: dict) -> float:
    response = post("/search/spending_over_time/", {"group": "fiscal_year", "filters": filters})
    return sum(row["aggregated_amount"] for row in response.get("results", []))


def fetch_contractor(recipient: dict) -> dict:
    """Fetch every per-contractor fact the detail page needs (5 API calls)."""
    uei = recipient["uei"]

    over_time = post(
        "/search/spending_over_time/",
        {"group": "fiscal_year", "filters": _by_uei(uei)},
    )
    yearly = {
        int(row["time_period"]["fiscal_year"]): row["aggregated_amount"]
        for row in over_time.get("results", [])
    }

    subagencies = post(
        "/search/spending_by_category/awarding_subagency/",
        {"filters": _by_uei(uei), "limit": 20},
    ).get("results", [])

    counts = post("/search/spending_by_award_count/", {"filters": _by_uei(uei)}).get("results", {})

    competed = _sum_over_time(_by_uei(uei, extent_competed_type_codes=COMPETED_CODES))
    not_competed = _sum_over_time(_by_uei(uei, extent_competed_type_codes=NOT_COMPETED_CODES))

    return {
        **recipient,
        "yearly_totals": [
            {"fiscal_year": fy, "amount": yearly.get(fy, 0.0)}
            for fy in range(FY_START, FY_END + 1)
        ],
        "agency_breakdown": [
            {"agency": row["name"], "amount": row["amount"]}
            for row in subagencies
            if row.get("amount")
        ],
        "contract_count": counts.get("contracts", 0),
        "competition": {"competed": competed, "not_competed": not_competed},
    }


def _load_checkpoint() -> dict[str, dict]:
    """Resume support: previously fetched contractors, keyed by UEI."""
    if CHECKPOINT.exists():
        return {c["uei"]: c for c in json.loads(CHECKPOINT.read_text())}
    return {}


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Ranking top {FETCH_N} DoD contractors, FY{FY_START}-FY{FY_END} ...")
    recipients = fetch_top_recipients()
    print(f"  got {len(recipients)} recipients")

    done = _load_checkpoint()
    todo = [r for r in recipients if r["uei"] not in done]
    if done:
        print(f"  resuming: {len(done)} already fetched, {len(todo)} to go")

    failed: list[tuple[dict, str]] = []
    # Two passes: the API drops connections under load, so retry stragglers
    # serially rather than losing them.
    for attempt, workers in ((1, MAX_WORKERS), (2, 1)):
        if not todo:
            break
        print(f"Pass {attempt}: fetching {len(todo)} contractors ({workers} worker(s)) ...")
        failed = []
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(fetch_contractor, r): r for r in todo}
            for i, future in enumerate(as_completed(futures), start=1):
                recipient = futures[future]
                try:
                    done[recipient["uei"]] = future.result()
                except Exception as exc:  # noqa: BLE001 - isolate one bad recipient
                    failed.append((recipient, f"{type(exc).__name__}: {exc}"))
                if i % 25 == 0:
                    print(f"  {i}/{len(todo)} ...", flush=True)
                    CHECKPOINT.write_text(json.dumps(list(done.values()), indent=2))
        CHECKPOINT.write_text(json.dumps(list(done.values()), indent=2))
        todo = [r for r, _ in failed]

    contractors = [done[r["uei"]] for r in recipients if r["uei"] in done]
    OUT.write_text(json.dumps(contractors, indent=2))
    print(f"Wrote {OUT} ({len(contractors)}/{len(recipients)} contractors)")

    if failed:
        print(f"WARNING: {len(failed)} recipients failed after 2 passes:")
        for recipient, error in failed:
            print(f"  - {recipient['name']}: {error}")


if __name__ == "__main__":
    main()
