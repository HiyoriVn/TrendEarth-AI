# SRS v1 reconciliation and verification evidence

**Review date:** 2026-11-15 (ICT)  
**Status:** Documentation review complete; NASA live responses **UNVERIFIED**  
**Scope:** Read-only review and request verification; no application code, measurements, or tests

## 1. Documents compared

| Document | Version/status at review | Relevant content |
|---|---|---|
| `docs/01-SRS-DRAFT.md` on base `main` | v0.1, not approved | T2M, two fixed sites, 1991–2024, annual series, OLS, p-value, provenance and broad mobile/error requirements. It could be read as expecting 34 points; it had no explicit minimum-year reporting threshold or detailed partial-data behavior. |
| `docs/01-SRS-DRAFT.md` on PR #4 branch `docs/srs-v1-review` | v0.9 candidate, not approved | Adds user journeys, static JSON architecture, complete-month aggregation, response-validation caveats, one-page UX requirements, and tests. It proposed a three-year minimum for OLS and left runtime/data-preparation state behavior and returned grid-coordinate fields insufficiently explicit. |
| `docs/04-DESIGN-BRIEF.md` on PR branch | Design proposal | Suggests location, variable, and date-range selectors, conflicting with the frozen MVP scope of T2M and 1991–2024. |
| Issues #1–#3 | Open at review | Require requirements approval, real NASA response evidence, and a single-page UX/static data contract agreed with the data work. |

The reconciled SRS retains the one-page static MVP, fixes T2M and the time window as non-interactive labels, distinguishes requested from returned coordinates, adds explicit data states, and sets a 30-complete-year reporting threshold. The threshold is a conservative product rule for this 34-year MVP window; it is not presented as a universal statistical requirement.

## 2. NASA POWER requests attempted

The following candidate requests were attempted directly from the workspace using PowerShell `Invoke-WebRequest`, 35-second timeout, `Accept: application/json`:

```text
https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M&community=SB&longitude=105.85&latitude=21.03&format=JSON&start=1991&end=2024
https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M&community=SB&longitude=105.78&latitude=10.03&format=JSON&start=1991&end=2024
```

### Exact observed failures

Both requests failed before receiving an HTTP response:

```text
Exception type: System.Net.Http.HttpRequestException
Message: No such host is known. (power.larc.nasa.gov:443)
```

No HTTP status, response headers, content type, or response body was received. This indicates DNS resolution failed in the verification environment; it does not establish whether NASA POWER itself was available or unavailable to other clients.

## 3. Required NASA facts — current verification state

| Field | Hanoi request | Can Tho request |
|---|---|---|
| HTTP response / actual JSON | **UNVERIFIED** — no response body | **UNVERIFIED** — no response body |
| Actual JSON structure / keys | **UNVERIFIED** | **UNVERIFIED** |
| Unit from response metadata | **UNVERIFIED** | **UNVERIFIED** |
| Product/source metadata from response | **UNVERIFIED** | **UNVERIFIED** |
| Requested coordinates | 21.03, 105.85 (from candidate request) | 10.03, 105.78 (from candidate request) |
| Returned grid coordinates | **UNVERIFIED** — not present because no body | **UNVERIFIED** — not present because no body |
| Returned start/end month and coverage | **UNVERIFIED** | **UNVERIFIED** |
| Missing-value markers actually observed | **UNVERIFIED** — no values received | **UNVERIFIED** — no values received |
| Complete annual values / count | **UNVERIFIED** | **UNVERIFIED** |

Do not populate production data, infer 34 complete annual points, assert a particular returned grid coordinate, or treat a candidate missing marker as actually observed based on this attempt. Any source-documented sentinel handling remains a processing rule to apply after the real response is inspected.

## 4. Review findings mapped to the four blockers

| P0 review blocker | Resolution in reconciled proposal | Remaining condition |
|---|---|---|
| Live NASA data and provenance not verified | Marked response, units, product, coverage, actual JSON, returned coordinates, and missing markers **UNVERIFIED**; exact failure recorded above. | Still blocks dataset approval and all scientific results. Re-run from a network that can resolve `power.larc.nasa.gov`; inspect both actual response bodies. |
| UX scope conflict | Location is the only selector; T2M and 1991–2024 remain fixed visible labels. | Technical Lead approves this scope; later wireframe must follow it. |
| Requested vs returned coordinates/data contract ambiguity | Separate `requestedCoordinates` and `returnedGridCoordinates`; include verification state, valid/excluded years, and threshold. | Populate returned metadata only from actual NASA response; agree/freeze schema after response inspection. |
| Partial data, sample threshold, and p-value policy unclear | Require 12 valid months per annual mean. Report OLS trend/p-value only for at least 30 complete years; below 30, show valid observations/exclusions and suppress those outputs. Label classical OLS p-value exploratory. | Technical Lead accepts the conservative product rule; this is not a guarantee of inferential validity. |

## 5. Review-derived acceptance criteria

1. Obtain and retain one actual NASA POWER response for each candidate site. Record exact request URL, access time, response status, response JSON structure, parameter and source metadata, unit, requested and returned coordinates (if returned), first/last valid monthly keys, and missing markers actually present.
2. Only a year with 12 valid monthly values can contribute to an annual value. Record exclusions and reasons; use calendar-day weighting, including leap-year days, after confirming the source's monthly-value semantics.
3. Show a trend, slope, and p-value only when there are at least 30 complete annual values among 1991–2024. Present this as the MVP's conservative reporting threshold, not a general statistical rule. Show valid years and exclusions at any sample size.
4. The only interactive data selector is location. Variable and period are displayed as fixed scope. Switching sites updates chart, summary, coordinates, and provenance together.
5. Distinguish measured annual values from fitted OLS values. Axes show year and °C; chart has a legend and does not rely on color alone.
6. Provide loading, ready, incomplete-data, below-threshold, and local JSON load/parse failure states. Never show placeholders or synthetic fixtures as observations. NASA API failure occurs during preparation, not as a runtime fallback for the static app.
7. Label classical two-sided OLS p-values exploratory and conditional on assumptions; do not imply causation, certainty, or practical importance. Describe values as grid-cell estimates rather than citywide/station measurements.

## 6. Review provenance

Three configured role reviews were completed in parallel and read-only: Data Researcher (NASA feasibility), UX Architect (one-page UX and schema coordination), and Science QA (aggregation and inference). No tests or scientific observations were performed by those reviews. NASA documentation is useful for planning but does not substitute for the missing site-specific responses.

Reference documentation:

- NASA POWER Monthly API: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
- NASA POWER temporal processing: https://power.larc.nasa.gov/docs/methodology/data/processing/
- NASA POWER services: https://power.larc.nasa.gov/docs/services/
- NASA POWER parameter dictionary: https://power.larc.nasa.gov/docs/tutorials/parameters/
