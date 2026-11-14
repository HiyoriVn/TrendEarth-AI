# TrendEarth AI — Software Requirements Specification (SRS)

**Version:** 0.9 — CANDIDATE FOR TECHNICAL-LEAD REVIEW  
**Status:** NOT APPROVED / NOT IMPLEMENTED  
**Target:** NASA Space Apps Challenge 2026 — *Be An Earth System Trend Detective!*  
**Document owner:** Technical Lead  
**Scope:** Hackathon MVP, three-person human team  
**Canonical issue:** [#1 Requirements approval](https://github.com/HiyoriVn/TrendEarth-AI/issues/1)

> The specifications below are proposed decisions, not verified claims of implementation, NASA data availability, scientific results or organizer approval. Freeze the scope after reviewing the four decisions in §13. Complete the MVP before expanding features.

## 1. Purpose and problem

Earth science data are available but difficult for non-specialists to retrieve, aggregate and interpret. TrendEarth AI will present **real NASA-derived historical data** for selected grid locations and help a user answer: what variable changed, where, in which direction, by how much, and what statistical evidence supports a linear trend.

**Product promise:** "Discover the change. Understand the evidence."

"AI" is a project name. An MVP using ordinary least squares (OLS) and deterministic explanations **must not claim to run machine learning, forecasting or an LLM**.

## 2. Stakeholders and responsibilities

| Role | Responsibility |
| --- | --- |
| Technical Lead + Visual Design (human) | SRS approval, architecture, scientific/visual signoff, integration and release |
| Slides + Presenter (human) | Storyboard, pitch, speech, attribution and submission coordination |
| Third teammate (human, allocation TBD) | Task support assigned by the Technical Lead; do not assume specialized expertise |
| Coding/research agents (if supported) | Bounded contributions with human validation; no autonomous merge or scientific claims |

Primary intended user: an undergraduate student or teacher exploring historical temperature changes. No claim of user interviews or observed market demand is made.

## 3. Objectives, success and non-goals

### 3.1 P0 measurable outcome

A working one-page desktop/mobile website that loads **precomputed JSON derived from NASA POWER T2M** for a representative point near Hanoi and a representative point near Can Tho, allows switching between them, plots the **annual mean** series and OLS trend, states the slope in **°C/decade**, and presents the p-value with an explicit assumptions caveat and reproducible source link.

### 3.2 P1 only if P0 is fully accepted

Cautious deterministic plain-English interpretation, optional clearer two-location comparison and refined visual motion. No P1 work may risk the submission.

### 3.3 Explicit exclusions

No paid APIs, authentication, database, live API server, LSTM/Transformer, predictive model, interactive geospatial map, free-form coordinates, station-level claims, causal attribution, invented data or AI-generated scientific assertions.

## 4. System boundary and architecture assumptions

- **Research / preparation time:** Python script requests NASA POWER monthly point data, validates metadata and monthly measurements, builds annual means, computes trend and exports JSON deterministically.
- **Runtime:** Static React/Vite frontend reads local JSON files; NASA API access is **not required** for a demo or during browsing.
- **Deployment:** A zero-cost static web host (selection pending) and GitHub repository with attribution and reproducibility instructions.
- **Trust boundary:** Never treat raw NASA JSON as guaranteed valid; validate response, variable, time keys, units, missing sentinels and actual coverage before deriving any output.

## 5. Primary user journeys

### UC-01 — Explore annual temperature at a fixed location

**Actor:** learner. **Precondition:** at least one verified derived JSON dataset is bundled.

1. User opens the site; sees the title, short promise and source label.
2. User selects **Hanoi (NASA POWER grid point)**.
3. System shows selected coordinates, data period, annual series, fitted linear line, observed-unit axis labels and a statistical summary.
4. User sees slope in °C/decade, p-value, sample size, significance *under OLS assumptions* and a caveat that point/grid data do not represent the entire city.
5. User can access source URL and methodology summary.

**Alternative:** missing/unvalidated data -> explicit unavailable message, not numbers or fake chart.

### UC-02 — Switch locations

User selects **Can Tho (NASA POWER grid point)**. Every chart label, coordinate, numeric result, source URL and explanation updates consistently; no stale fields from the previously selected location.

### UC-03 — Inspect a caveat

User opens/reads a plain-language "About these results" section: data product type, spatial caveat, monthly-to-annual rule, fitted trend assumptions, and warning that significance is not causality.

## 6. Functional requirements

| ID | Priority | Requirement | Acceptance test |
| --- | --- | --- | --- |
| FR-01 | P0 | Select between two fixed location labels; show their exact coordinates | Switching changes every location-dependent field; no stale values |
| FR-02 | P0 | Use only validated NASA POWER monthly T2M source data for 1991–2024 | Every displayed observation maps to a reproducible raw record and computation |
| FR-03 | P0 | Aggregate 12 monthly mean temperatures to one annual mean, weighting by calendar month length | Synthetic leap/non-leap unit tests match manually calculated annual means |
| FR-04 | P0 | Exclude and explicitly report any year with missing or invalid months | No missing sentinel, NaN or fabricated zero shown as a measured value |
| FR-05 | P0 | Plot valid annual values and fitted OLS series as distinct labelled series | X axis year; Y axis °C; fitted line does not appear as measured values |
| FR-06 | P0 | Show slope in °C/decade, n, p-value and method | Reference numerical test matches within a documented tolerance |
| FR-07 | P0 | Explain statistical uncertainty and source limitations | No "proved climate cause", "city-wide" or unsupported "AI prediction" language |
| FR-08 | P0 | Show NASA data provenance: URL, retrieval date, variable, grid-point coordinates, product/dataset when available | Reproducibility information is accessible from the website or linked repo |
| FR-09 | P0 | Show explicit loading, empty, invalid-data and failed-fetch states | No fabricated fallback; informative accessible error state |
| FR-10 | P0 | Responsive and keyboard-operable location selector and chart summary | 360px and desktop smoke test; labels and focus visible |
| FR-11 | P1 | Deterministic plain-English interpretation from precomputed numeric results | Narrative changes correctly by sign and p-value; no hardcoded unsupported claim |
| FR-12 | P2 | Extra variables, locations, charts or long-term prediction | Deferred, not accepted into hackathon MVP |

## 7. Dataset and scientific processing contract

### 7.1 Proposed NASA requests (MUST VERIFY)

- Hanoi point: latitude 21.03, longitude 105.85.
- Can Tho point: latitude 10.03, longitude 105.78.
- Variable: \`T2M\`; proposed 1991–2024 inclusive; candidate API endpoint \`/api/temporal/monthly/point\` using \`community=SB\`.
- Official documentation: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
- Full candidate URLs and scientific checks: [docs/03-SCIENCE-DATA-PROTOCOL.md](03-SCIENCE-DATA-PROTOCOL.md).

**Do not assert** that API coverage, exact response keys, underlying sub-dataset, metadata names, grid resolution or sentinel values are confirmed until an actual response is obtained and recorded in issue #2.

### 7.2 Deterministic ETL rules

1. Validate HTTP success, JSON structure, parameter \`T2M\`, calendar coverage and Celsius unit from metadata.
2. Extract **only monthly \`YYYYMM\` values**, if that is the actual response format; ignore any annual-aggregate fields to avoid double counting.
3. Reject nulls, non-finite values and source-documented missing markers. Never turn missing values into 0.
4. Require **all 12 valid months** for each included year; record exclusion and reason for incomplete years.
5. Calculate annual average of monthly means with **calendar-day weighting**: \`sum(T_month * days_in_month) / sum(days_in_month)\`, only after verifying API's monthly statistic semantics.
6. OLS uses \`x = year\`, \`y = annualMean°C\`; slope-per-decade = 10 × slope-per-year. At least **3 valid years** are required; otherwise no inferential result.
7. Report OLS two-sided p-value with a caution that temporal autocorrelation, model assumptions and multiple testing may affect significance. **p < 0.05 is not proof of causation or robust climate attribution**.
8. All climate numbers rendered in the app must derive from this real pipeline. Test fixtures may be synthetic but cannot be shipped as apparent observations.
9. Save retrieval timestamp, full source URL, data product metadata, units, valid-year count, excluded years, processing notes and method version.

## 8. Proposed static JSON contract (NOT YET FROZEN)

One file per grid-point, e.g. \`frontend/public/data/hanoi.json\` and \`can-tho.json\`. Numeric values below are deliberately \`null\` placeholders (NOT observations):

\`\`\`json
{
  "schemaVersion": "1.0-draft",
  "locationId": "hanoi",
  "label": "Hanoi (NASA POWER grid point)",
  "coordinates": {"latitude": 21.03, "longitude": 105.85},
  "variable": "T2M",
  "unit": "degC",
  "period": {"startYear": 1991, "endYear": 2024},
  "source": {
    "provider": "NASA POWER",
    "product": "UNVERIFIED",
    "url": "UNVERIFIED",
    "retrievedAt": null
  },
  "processing": {
    "aggregation": "day-weighted complete monthly means",
    "requiredMonthsPerYear": 12,
    "version": "UNVERIFIED"
  },
  "observations": [],
  "excludedYears": [],
  "trend": {
    "method": "OLS",
    "n": null,
    "slopePerYear": null,
    "slopePerDecade": null,
    "intercept": null,
    "pValue": null,
    "rSquared": null
  }
}
\`\`\`

The actual production JSON must replace every unknown with either verified content or an explicit documented unavailability state; no fictitious measurement or statistical number may be present. Data and UI agents must agree on this schema before coding.

## 9. UI and accessibility requirements

- **One-screen-first layout:** short problem statement; two-location control; summary cards for °C/decade, p-value and n; annual chart; methods/source/caveat disclosure.
- All chart series, axes, units and fit/observed distinction are visible without relying solely on color.
- Small-screen baseline: 360px viewport, no horizontal page overflow, readable annotation and legible source links.
- User can navigate selectors and details using keyboard; semantic labels and visible focus.
- Four explicit view states: **ready**, **loading**, **no/insufficient valid data**, **load/parse failure**.
- Public interface language English; internal project documents may be Vietnamese.
- Design brief and signoff in [docs/04-DESIGN-BRIEF.md](04-DESIGN-BRIEF.md).

## 10. Non-functional requirements and quality gates

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-01 | Zero-cost deployable static app; no secret or backend required in demo | Local production build and deployed URL smoke test |
| NFR-02 | Numerical reproducibility from stored raw NASA response or documented retrieval procedure | Re-running ETL on identical input yields identical observations/statistics, except non-semantic timestamps |
| NFR-03 | Robust input/error handling; do not silently substitute mock climate records | Invalid/incomplete fixture tests; UI failure path |
| NFR-04 | Mobile/desktop readability and keyboard accessibility | 360px + desktop smoke checks |
| NFR-05 | Legal/scientific attribution, provenance and no unsupported claims | README/UI/pitch review |
| NFR-06 | No unused large dependencies, credentials or privileged deployment by agents | Dependency audit, git status, release gate |

## 11. Verification matrix

| Test | Verifies | Evidence to retain |
| --- | --- | --- |
| T-01 | T2M source metadata, monthly keys and range | Raw NASA response excerpt, URL and retrieval time |
| T-02 | Day-weighted annual mean and leap-year handling | Controlled numeric unit tests |
| T-03 | Missing/invalid months excluded and reported | Missing-value and sentinel fixtures |
| T-04 | OLS slope ×10, p-value, n and fitted line | Reference scientific test |
| T-05 | Location switch consistency | Manual/browser integration test |
| T-06 | Offline/static dataset availability and explicit error states | Browser smoke result |
| T-07 | Responsive 360px, desktop, keyboard and units | Screenshot/checklist |
| T-08 | Deployed link, GitHub reproducibility and pitch claim consistency | Release checklist + submission proof |

A test is **NOT PASSED** until it has actually been run and its output inspected.

## 12. Release and submission

- Mandatory: stable site, verified real data or transparent reduced-scope failure disclosure, reproducibility README, science/source attribution, test evidence, backup screenshots/video, pitch and all required submission URLs.
- No deployment/publication without Technical Lead approval, per \`AGENTS.md\`.
- Local judging time should be rechecked against organizer announcements; conservative internal release freeze should be before 11:00 ICT on 2026-11-15.
- If live data ingestion fails, cut locations/years rather than fabricate or misrepresent observations. If no defensible data can be obtained, disclose limitation rather than submit made-up science.

## 13. Four blocking sign-offs

- [ ] **Identity/licensing:** public repository and Apache-2.0 remain acceptable; entry named "TrendEarth AI".
- [ ] **Data scope:** two candidate grid points, NASA POWER T2M and 1991–2024, contingent on verified response coverage.
- [ ] **Science/UI scope:** one-screen OLS trend explorer, p-value with stated caveats; advanced AI deferred.
- [ ] **Release:** confirm competition submission procedure and conservative local timeline.

**Decision log:** [docs/07-DECISIONS-RISKS.md](07-DECISIONS-RISKS.md).  
**Stage gate:** after the Technical Lead signs off, mark this SRS v1.0 **APPROVED**, then freeze JSON contract/design and begin implementation.