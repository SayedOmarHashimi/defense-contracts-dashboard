# Phase 2 ideas

A running list, kept deliberately unbuilt. Ship one at a time and watch what
people actually use before starting the next.

## From the original plan

- **Search** — the leaderboard filters the top 100 by name. Real search would
  cover contractors outside the top 100, which means either a larger export or
  a search index.
- **Map view** — place-of-performance is available from USASpending but is not
  currently pulled. Adds a dimension to the ingest, not just the UI.
- **Contractor comparison mode** — two or three contractors side by side on the
  same axes. The data already supports it; it is a UI and URL-state problem.

## Found while building

- **Parent/subsidiary rollup.** Same-name UEI registrations are merged, but
  subsidiaries trading under their own name are separate contractors: Sikorsky
  is listed apart from Lockheed, and RTX apart from Raytheon. USASpending
  exposes a parent recipient hash that would allow a real corporate-family
  view. This is the single biggest fidelity gap, and it is documented on the
  methodology page rather than hidden.
- **Dark mode.** The site is light-only. The chart palette already has
  validated dark steps ready to use, but the page shell needs treating too.
- **Trim the chart bundle.** Recharts is 110 kB on the detail route, against
  175 B on every other page. Two static bar charts do not need a charting
  library; hand-rolled SVG would remove nearly all of it.
- **Cache the raw snapshot between refreshes.** The daily job re-fetches all
  150 contractors from scratch because `data/raw/` is gitignored. Caching it
  in the workflow would cut the run from ~40 minutes to minutes.
- **Widen beyond DoD.** The pipeline is agency-parameterised in `config.py`;
  pointing it at another department is a configuration change, not a rewrite.
- **Award-level drill-down.** Individual contracts behind each contractor.
  This changes the data volume by orders of magnitude and would end the
  "static JSON in the repo" architecture, so it needs a deliberate decision.

## Watch after launch

- Whether contractor pages get shared (the per-page Open Graph cards were
  built for this).
- Whether the daily refresh job stays inside its two-hour budget as
  USASpending's data grows.
- Whether the yellow/orange adjacency ever matters — currently only two
  categorical colours are on screen at once, so it does not.
