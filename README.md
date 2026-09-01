# Defense Contracts Dashboard

A public, statically-generated dashboard of U.S. Department of Defense prime
contract awards, built from [USASpending.gov](https://www.usaspending.gov)
open data. No authentication, no database, no API keys.

## Status

| Stage | Scope                            | State       |
| ----- | -------------------------------- | ----------- |
| 0     | Ingestion pipeline → static JSON | in progress |
| 1     | Next.js scaffold + routing       | not started |
| 2     | Typed data-loading layer         | not started |
| 3     | Leaderboard (home page)          | not started |
| 4     | Contractor detail pages          | not started |
| 5     | Animation / polish pass          | not started |
| 6     | Deploy config + methodology page | not started |

## Data pipeline

The pipeline is plain Python 3 with no third-party dependencies — it uses only
the standard library, so there is nothing to install.

```bash
cd pipeline
python3 run.py
```

That runs two layers:

**`extract.py`** ranks the top DoD prime-contract recipients and pulls five
facts for each (yearly obligations, awarding sub-agency breakdown, contract
count, and competed vs. non-competed totals). Raw responses are snapshotted to
`data/raw/` and checkpointed, so an interrupted run resumes instead of
restarting.

**`transform.py`** merges UEI registrations belonging to the same company,
derives shares and percentages, and writes the site's data contract.

### Data contract

```
data/contractors.json          leaderboard rows
data/contractor/<slug>.json    per-contractor detail
data/meta.json                 provenance for the /methodology page
```

`contractors.json` — one object per contractor:

| Field            | Type   | Notes                                        |
| ---------------- | ------ | -------------------------------------------- |
| `id`             | number | rank, 1 = largest by obligations             |
| `name`           | string |                                              |
| `slug`           | string | routing key for `/contractor/[slug]`, unique |
| `total_awarded`  | number | USD obligated across the window              |
| `contract_count` | number | prime contract awards                        |
| `top_agency`     | string | largest awarding sub-agency                  |

`contractor/<slug>.json` — the summary fields above plus `ueis`,
`yearly_totals[]`, `agency_breakdown[]`, and `competition_mix`.

## Data layer

`lib/data.ts` reads the JSON above with `fs/promises` inside Server Components
and exports a TypeScript interface per file shape. It imports `server-only`, so
any accidental import from a Client Component fails the build rather than
shipping the dataset to the browser. Every contractor page is prerendered via
`generateStaticParams`, and `dynamicParams = false` makes an unknown slug a 404
instead of an on-demand render.

## Motion

Motion is CSS-only and deliberately restrained, following Emil Kowalski's
animation guidance:

| Element | Motion | Duration |
| ------- | ------ | -------- |
| Route change | opacity fade (`app/template.tsx`) | 180ms |
| Detail page sections | opacity + 8px rise, 40ms stagger | 260ms |
| Leaderboard rows | background colour on hover | 120ms |

All of it uses `transform` and `opacity` only, on a strong ease-out
(`cubic-bezier(0.23, 1, 0.32, 1)`). Hover is gated behind
`(hover: hover) and (pointer: fine)` so tapping on a touch device does not
leave a stuck highlight, and every interactive element has a visible
`:focus-visible` ring.

No JavaScript animation library is used. All of this motion is
predetermined, and CSS animations run off the main thread, so they keep
playing smoothly while the page is still loading and hydrating. Table rows
never move: they are data being read, so only their background changes.

Under `prefers-reduced-motion: reduce` every animation falls back to a
120ms opacity fade with the stagger removed - gentler and fewer, not none,
so content still does not teleport into place.

## Scope and caveats

- **Agency:** Department of Defense only, as the _awarding_ agency.
- **Award types:** FPDS codes `A`, `B`, `C`, `D` — BPA calls, purchase
  orders, delivery orders, and definitive contracts. Indefinite delivery
  vehicles (IDVs), grants, and loans are excluded.
- **Window:** FY2020–FY2025 (federal fiscal years end September 30).
- **Obligations, not outlays.** Figures are amounts _obligated_ in a fiscal
  year, not cash disbursed. Large multi-year awards land entirely in the year
  they were obligated, which makes single-year totals lumpy.
- **Entity merging.** One company can hold several UEI registrations.
  Same-name registrations are merged into a single contractor; the
  constituent UEIs are listed on each detail record. Parent/subsidiary
  relationships (e.g. a subsidiary trading under its own name) are _not_
  rolled up.
- **Negative amounts are real.** Net deobligations make some fiscal years and
  some agency totals negative. Charts use a zero baseline rather than a
  part-to-whole form, which cannot represent a negative share.
- **Competition split** uses the FPDS extent-competed code. Competed =
  `A`, `D`, `F`, `CDO`; not competed = `B`, `C`, `E`, `G`, `NDO`. Note that
  "follow-on to competed action" (`E`) counts as not competed.
- **Data lag.** USASpending is not real-time; recent months are incomplete
  and prior periods are restated as agencies correct filings.

### One API note worth knowing

USASpending's `recipient_id` filter is **silently ignored** by the
`spending_by_award` and `spending_by_award_count` endpoints — they return
agency-wide results while appearing to succeed. This pipeline filters by
**UEI** through `recipient_search_text`, which every endpoint honors
consistently. `transform.py` cross-checks that each contractor's yearly
totals, agency breakdown, and competition split all sum to the same figure.

## License

Source data is U.S. Government public domain.
