# Reproduce and integrate NASA T2M data

From repository root, use Python 3.12 in a virtual environment:

```sh
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .venv/Scripts/Activate.ps1
python -m pip install -r pipeline/requirements.txt
python -m unittest discover -s tests -v
python pipeline/analyze.py --out-dir /tmp/trendearth-reproduced
```

Analysis is offline: exact cached NASA responses are in `data/raw/`; the
probe summary records URLs, timestamps, hashes and Actions run 43624190717.
The workflow only captured responses; analysis validates them separately.
To deliberately refresh, fetch into a separate directory first:
`python pipeline/fetch_power.py --raw-dir new-capture --timeout 30`, then
`python pipeline/analyze.py --raw-dir new-capture --out-dir new-processed`.
Review before replacing the frozen data. Fetch failures return nonzero and
record actual errors; no synthetic fallback is generated.

## Static frontend contract

Canonical files are `data/processed/hanoi.json` and
`data/processed/can-tho.json`. The frontend build owner should copy these files
unchanged to its public `data/` directory, exposing `/data/hanoi.json` and
`/data/can-tho.json` (prefix with the deployment base path for subpath hosting).
This branch does not change frontend assets or deploy them.

Read `observations` as `{year,value}` in degC. Draw a fit only when
`trend.reportingStatus === 'REPORTED_EXPLORATORY'`, using
`trend.intercept + trend.slopePerYear * year`. Display `slopePerDecade` and
`pValueTwoSided` without recalculating them. Suppressed numeric fields are null;
keep observations and exclusions visible. The 30 complete-year gate is a
conservative product rule, not a universal statistical requirement.

Each annual mean requires 12 finite non-sentinel monthly values, weighted by
Gregorian month length, including leap years. NASA YYYY13 summary values are
ignored. OLS uses calendar years. Classical two-sided p-values are exploratory:
autocorrelation is not corrected, and neither causation nor citywide conditions
can be inferred from a single NASA POWER point. Returned geometry is preserved;
it does not independently establish a native grid-cell center.

Floating numerical comparisons use 1e-12 tolerances to allow platform/BLAS
roundoff. Raw response SHA-256 hashes must match exactly. CI runs unit tests and
offline regeneration on pushes and PRs; it performs no fetching or deployment.
