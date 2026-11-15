# TrendEarth AI — Software Requirements Specification

**Version:** 1.0 proposal  
**Approval:** Pending Technical Lead review; **NO-GO for implementation pending evidence and sign-off**  
**Scope:** Hackathon MVP; documentation proposal only

This proposal reconciles the workspace SRS draft with the SRS candidate in PR #4 (`docs/srs-v1-review`) and incorporates the Data Researcher, UX Architect, and Science QA reviews. It resolves the four review blockers as explicit requirements and an evidence-based status: NASA response verification remains UNVERIFIED because both live requests failed before returning an HTTP response. The 30-year rule below is a conservative TrendEarth reporting policy, not a universal statistical requirement. This document does not authorize implementation. Technical Lead approval and the release blockers in §9 are required before design/build.

## 1. Problem and objective

Help a student or teacher explore a NASA Earth-system time series and understand what is changing, where, by how much, and what the statistical result does and does not establish. The MVP presents annual near-surface air temperature for two fixed grid points, with a reproducible trend calculation and visible source and limitations.

“TrendEarth AI” is the project name. The MVP does not use or claim an AI model.

## 2. Users and primary scenario

The primary user is a student or teacher with no assumed climate-data or statistics expertise. They select Hanoi or Can Tho, inspect the annual temperature series and trend, and read the result with its statistical assumptions and spatial limitations. No user interviews or user research are claimed.

## 3. Fixed MVP scope

| Item | Proposed v1 scope |
|---|---|
| Source | NASA POWER Monthly Point API; retain and cite exact request and response metadata |
| Variable | `T2M`, air temperature at 2 m; verify returned unit metadata before processing/display |
| Sites | Hanoi requested point (21.03, 105.85); Can Tho requested point (10.03, 105.78) |
| Period | 1991–2024 inclusive, subject to response validation |
| Annual series | Day-weighted mean from monthly values; an included year requires 12 valid months |
| Reporting threshold | Report the fitted trend and its p-value only when at least 30 of the 34 annual values are complete; conservative product rule, not a universal statistical requirement |
| Analysis | Ordinary least-squares linear trend; slope displayed in °C/decade; two-sided test of zero slope, labelled exploratory |
| Delivery | Static, responsive frontend with precomputed, provenance-bearing JSON; no secrets or paid services |

Coordinates above identify requested points. The UI and metadata must also report the actual NASA grid coordinates when provided by the response. Results describe the selected NASA POWER grid cell, not a city or weather station.

## 4. Functional requirements

| ID | Priority | Requirement | Acceptance evidence |
|---|---|---|---|
| FR-01 | P0 | Offer Hanoi and Can Tho in a clearly labelled location selector. T2M and 1991–2024 remain visibly identified as fixed scope. | Selecting either site updates its label, chart, statistics, coordinates, and provenance together. |
| FR-02 | P0 | Present only validated NASA POWER monthly T2M data aggregated to annual values for 1991–2024. | Each included year has 12 valid monthly inputs. Show valid-year count, covered years, and exclusions; never imply 34 complete years unless all 34 validate. |
| FR-03 | P0 | Show annual observations and a fitted linear trend on a chart. | Year and temperature axes include labels and units; legend and non-color-only line distinction are available; fitted values align with the corresponding years. |
| FR-04 | P0 | Compute the OLS slope and display `10 × slope` in °C/decade. | Numerical unit checks against controlled synthetic fixtures verify slope, decade conversion, and fitted values within a stated tolerance. |
| FR-05 | P0 | Show valid annual sample size and a two-sided p-value for the OLS zero-slope test only when at least 30 complete annual values are available. | The 30-of-34 threshold is an explicit conservative product reporting rule, not a universal statistical requirement. Below 30, show valid observations and exclusions but suppress the fitted trend, slope, and p-value with an explanation. At or above 30, identify the classical OLS p-value as exploratory and conditional on assumptions; do not imply causation or practical importance. Guard zero variance. |
| FR-06 | P0 | Make source and method inspectable on the same page. | Show NASA POWER attribution/link, exact API request URL, access timestamp, requested and returned coordinates, source/product, unit, period, transformation, missing-value policy, valid years, and grid-cell caveat. |
| FR-07 | P0 | Provide honest loading, ready, incomplete-data, insufficient-data, and local data load/parse failure states. | No mock or placeholder values are presented as observations. Incomplete years are excluded and listed. Below the 30-year product threshold, suppress trend statistics. The static runtime reads bundled JSON; NASA API retrieval failure is a data-preparation state, not a runtime fallback. |
| FR-08 | P0 | Support keyboard use, mobile and desktop layouts, and readable scientific content. | Selector and source/method details are keyboard reachable; at 360 px viewport there is no horizontal overflow; labels remain legible and significance is not conveyed by color alone. |
| FR-09 | P1 | Provide a plain-language summary derived only from displayed computed fields. | Summary updates with the selected series and makes no causal, citywide, or policy claims. |
| FR-10 | P2 | Add other variables or arbitrary coordinates. | Out of MVP; requires a separate scope decision after P0 acceptance. |

## 5. Data and calculation requirements

1. Request monthly `T2M` for each fixed point and 1991–2024 from the NASA POWER Monthly Point API. Record the community/parameter options and returned metadata. Verify the actual response before asserting coverage, units, actual JSON keys, or complete annual values. Current live response status is documented in `docs/11-SRS-V1-REVIEW-EVIDENCE.md` and is UNVERIFIED.
2. Preserve the raw response used to generate each delivered data file, along with the exact request URL and retrieval timestamp. Cache only real NASA responses. Do not commit credentials or unnecessary large raw files.
3. Where NASA returns a missing sentinel such as `-999`, treat it as missing, never as a temperature. Require 12 valid monthly records for an annual value. Do not impute or silently fill missing months or years. Exclude incomplete years from regression and disclose them in the UI and metadata.
4. For each complete year, compute `annual_mean = Σ(monthly_mean × days_in_month) / days_in_year`, using the calendar year and leap-year day counts. Record this transformation. Confirm the source's monthly value semantics and units before using this formula.
5. Fit OLS to `(calendar year, annual_mean_°C)` pairs. The displayed rate is `10 × slope` in °C/decade. Use the same fitted model for the chart's trend line and reported statistics.
6. Apply the product reporting gate: show OLS line, slope, and p-value only for `n ≥ 30` complete annual values among the 34 possible years. This threshold is a conservative product choice for this MVP, not a universal statistical criterion or guarantee of valid inference. At `n < 30`, show available observations and exclusions, but suppress those trend outputs.
7. The reported p-value is the two-sided classical OLS test of a zero slope. Because annual climate observations can be temporally autocorrelated and this MVP does not specify an autocorrelation correction, label the p-value exploratory and state that inference is conditional on model assumptions. Do not describe `p < 0.05` as proof of causation, importance, or certainty.
8. Describe values as NASA POWER model/reanalysis grid-cell estimates at returned grid coordinates when the response provides them. Do not infer citywide conditions, station measurements, urban heat-island effects, causes, or policy outcomes from this series alone.

## 6. Proposed data contract

Freeze this contract only after the NASA response has been inspected and the Technical Lead approves the data and method decisions.

```json
{
  "locationId": "hanoi",
  "label": "Hanoi (NASA POWER grid cell)",
  "requestedCoordinates": { "latitude": 21.03, "longitude": 105.85 },
  "returnedGridCoordinates": null,
  "variable": "T2M",
  "unit": null,
  "expectedUnit": "degC; verify against NASA response metadata before use",
  "startYear": 1991,
  "endYear": 2024,
  "validYears": [],
  "excludedYears": [],
  "completeYearCount": 0,
  "reportingThresholdYears": 30,
  "source": "NASA POWER Monthly Point API",
  "sourceUrl": "<exact request URL>",
  "accessedAt": "<ISO-8601 timestamp>",
  "verificationStatus": "UNVERIFIED",
  "responseMetadata": null,
  "missingValueMarkersObserved": null,
  "processing": "Day-weighted mean of 12 valid monthly T2M values; leap-year calendar days used",
  "missingValuePolicy": "Treat documented sentinel values as missing; exclude years without 12 valid months",
  "observations": [],
  "trend": {
    "slopePerYear": null,
    "slopePerDecade": null,
    "pValueTwoSided": null,
    "validYearCount": null,
    "reportingStatus": "suppressed until at least 30 complete years",
    "method": "OLS; classical p-value is exploratory"
  }
}
```

`null` values above are schema placeholders, not measurements. The example is not an observed NASA response and must not be used as a production dataset. The final schema must preserve requested coordinates separately from returned grid coordinates and include the actual response structure or an explicit UNVERIFIED state.

## 7. Nonfunctional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-01 | Static frontend; no secrets or paid runtime services. | Production build and host run without a backend. |
| NFR-02 | Deterministic, reproducible processing. | Same validated raw inputs and configuration produce identical derived JSON. |
| NFR-03 | Accessible and responsive. | Keyboard, contrast/readability, and 360 px viewport checks. |
| NFR-04 | Scientific integrity and traceable provenance. | Every displayed result traces to sourced input and documented processing; no fabricated observations or claims. |
| NFR-05 | Repository includes license, source attribution, and reproducibility instructions. | Repository review. |
| NFR-06 | Product and pitch do not imply AI model functionality or NASA endorsement. | UI, README, and pitch copy review. |

## 8. Verification and definition of done

Before release, verify both live NASA responses or explicitly mark the endpoint unverified and do not ship unverified values. Retain source metadata and evidence for each series. Automated numerical checks must use synthetic fixtures only and cover: missing sentinel handling, incomplete-year exclusion, day-weighting including leap years, known OLS slope and decade conversion, year/value alignment, p-value behavior against a controlled reference, insufficient-sample handling, and zero-variance handling. Synthetic values must never be presented as scientific results.

The MVP is complete when the P0 requirements are met, a user can switch sites and inspect a traceable result, science and UX acceptance checks pass, the static build is demonstrable on mobile and desktop, NASA attribution is present, and required submission links and backup media are verified.

## 9. Technical Lead approval decisions and remaining blockers

These decisions block the transition from requirements to design/build:

1. Confirm repository visibility and Apache-2.0 license as proposed in the original project materials.
2. Approve the two requested coordinates and 1991–2024 period, subject to actual NASA response validation for both sites.
3. Approve the annual aggregation policy (day-weighted monthly means; all 12 months required), the 30-complete-year reporting threshold as a conservative product rule, and classical OLS p-value labelled exploratory. A different inferential method needs a documented decision and validation plan.
4. Confirm project spelling as `TrendEarth AI` and confirm the organizer's submission process/deadline requirements.
5. Approve the UX behavior: location is the sole selector in MVP; variable and date window are fixed; source and methods are available in-page. Partial data and below-threshold data show observations and exclusions but suppress trend outputs.

**Blocking evidence gap:** no NASA HTTP response body has been obtained for either requested site. The endpoint, actual response schema, unit, returned coordinates, temporal coverage, and missing-value markers therefore remain UNVERIFIED. Do not approve a data contract as populated or start implementation against assumed response fields until this gap is closed or the Technical Lead explicitly accepts a documented reduced-scope/no-data path.

No implementation, deployment, or publication is authorized by this proposal. After approval, update the approved SRS status and proceed through the documented stage gates.

## 10. Review evidence and source references

The three parallel reviews were read-only and changed no files. NASA documentation supports feasibility in principle, but neither live response nor site coverage was verified. The UX review identified and resolved the selector scope conflict by fixing T2M and the period and retaining one location selector. The Science QA review recommended complete-year rules and qualified OLS inference; this proposal adds the 30-year conservative product reporting threshold. Exact verification attempts and observed failure details are recorded in `docs/11-SRS-V1-REVIEW-EVIDENCE.md`.

- [NASA POWER Monthly API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/)
- [NASA POWER temporal processing](https://power.larc.nasa.gov/docs/methodology/data/processing/)
- [NASA POWER service guidance](https://power.larc.nasa.gov/docs/services/)
- [NASA POWER API overview](https://power.larc.nasa.gov/docs/services/api/)
- [NASA POWER parameter dictionary](https://power.larc.nasa.gov/docs/tutorials/parameters/)
- [NASA POWER API limitations](https://power.larc.nasa.gov/docs/services/api/projection/)

Comparison source: SRS v0.1 in `docs/01-SRS-DRAFT.md` on the base branch and SRS v0.9 candidate in PR #4 on `docs/srs-v1-review`. The candidate's one-screen UX is retained; fixed-scope selectors, coordinate provenance, partial-data behavior, and the 30-year reporting gate are made explicit here.

