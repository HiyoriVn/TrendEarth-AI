# Climate Explorer verification — Issue #12

Executed locally on Windows:
- Python unittest: 16 tests passed after restoring exact committed raw bytes.
- Frontend unit suite: 26 passed, 0 failed (15 existing + 11 new).
- Production build: passed, 28 modules, final component-oriented CSS.
- NASA raw hashes match after byte-preserving checkout; .gitattributes prevents
  Windows line-ending conversion for raw/processed/static dataset assets.

New numerical tests cover complete30-year baseline and zero-mean anomalies,
missing baselines, trailing5 contiguous windows, gap handling, aligned inspection,
CSV raw values/provenance/exclusions and escaping. Synthetic fixtures stay in tests.

Four Playwright browser tests were added for controls, comparison, modes, inspector,
CSV download, missing/invalid responses, keyboard selection and1440/360px layouts.
Local Edge exited during launch (browserType.launch: Target page, context or browser
has been closed; temporary profile/Crashpad errors). Tests failed before page creation;
no browser interaction/rendered layout approval or screenshots are claimed.
CI installs Chromium and reruns these checks; inspect its results before release.

Scientific invariants: canonical datasets and Python algorithms unchanged; full-window
OLS metrics kept separate from descriptive transforms; no regression on transformed
series. Baseline requires every annual year1991–2020. Moving windows trail by4years
and never bridge gaps. CSV always exports raw annual values with per-site metadata.

Manual release checks: compare all modes, focus/click points, keyboard year selection,
CSV contents, mobile overflow, missing/invalid sources and below-threshold data.
No merge or deployment was performed.
