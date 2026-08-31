"""Thin, resilient client for the USASpending.gov public API.

No API key is required. The client retries on transient failures and
throttles concurrency so the pipeline stays a well-behaved consumer.
"""

from __future__ import annotations

import http.client
import json
import random
import time
import urllib.error
import urllib.request

from config import API_BASE, MAX_RETRIES, TIMEOUT_SECONDS

RETRY_STATUS = {429, 500, 502, 503, 504}


class USASpendingError(RuntimeError):
    pass


def post(path: str, payload: dict) -> dict:
    """POST to the API, retrying transient errors with exponential backoff."""
    url = f"{API_BASE}{path}"
    body = json.dumps(payload).encode()
    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        request = urllib.request.Request(
            url,
            data=body,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "defense-contracts-dashboard/1.0 (public data pipeline)",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
                return json.loads(response.read())
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code not in RETRY_STATUS:
                raise USASpendingError(
                    f"{path} returned HTTP {exc.code}: {exc.read().decode()[:500]}"
                ) from exc
        except (
            urllib.error.URLError,
            http.client.HTTPException,  # incl. RemoteDisconnected
            OSError,  # incl. ConnectionResetError
            TimeoutError,
            json.JSONDecodeError,
        ) as exc:
            # The API drops connections under sustained load; these are all
            # transient and worth another attempt.
            last_error = exc

        if attempt < MAX_RETRIES - 1:
            time.sleep(2**attempt + random.random())

    raise USASpendingError(f"{path} failed after {MAX_RETRIES} attempts: {last_error}")


def paginate(path: str, payload: dict, page_limit: int = 100) -> list[dict]:
    """Walk a paginated category endpoint and return all result rows."""
    rows: list[dict] = []
    page = 1
    while page <= page_limit:
        response = post(path, {**payload, "page": page})
        results = response.get("results", [])
        rows.extend(results)
        if not response.get("page_metadata", {}).get("hasNext"):
            break
        page += 1
    return rows
