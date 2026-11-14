# Software Requirements Specification — TrendEarth AI
**Version:** 0.1 DRAFT · **approval:** NOT APPROVED · **priority:** hackathon MVP

## 1. Problem and user needs
Earth observation/model datasets are hard for a novice to retrieve, summarize and interpret. A viewer needs a guided way to see trends without misinterpreting noise or a spatial grid cell as a whole city. The NASA challenge asks what is changing, where, by how much and whether it is significant.

## 2. Personas / primary scenario
Primary persona: a university student or teacher exploring Earth-data evidence. Scenario: select 'Hanoi', inspect annual temperature changes from 1991 to 2024, read numeric slope and p-value with assumptions, then switch to 'Can Tho' to compare context. No invented end-user interviews.

## 3. Functional requirements
| ID | Priority | Requirement | Acceptance evidence |
| --- | --- | --- | --- |
| FR-01 | P0 | Offer two labelled locations with coordinates | Selected site visible; values change correctly |
| FR-02 | P0 | Show NASA POWER T2M annual series from 1991–2024 | 34 complete annual points or explicit missing-year warnings |
| FR-03 | P0 | Show observation chart and fitted linear trend | Both series correctly keyed by year; axes labelled °C |
| FR-04 | P0 | Compute OLS slope and convert to °C/decade | Slope matches independent reference test within tolerance |
| FR-05 | P0 | Display p-value and safe significance wording | No invented significance; uncertainty/assumptions visible |
| FR-06 | P0 | Show source metadata and methods | API URL, source, date range, grid caveat and transform visible |
| FR-07 | P0 | Display clear error/loading/fallback states | User never sees fake output when API unavailable |
| FR-08 | P0 | Work on mobile and desktop | Keyboard, mobile viewport and text legibility smoke checked |
| FR-09 | P1 | Provide plain-language summary | Narrative grounded in computed fields; not generative guessing |
| FR-10 | P2 | Additional variable and user-selected lat/lon | Deferred until P0 accepted |

## 4. Nonfunctional requirements
| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-01 | Runs as static frontend without secrets/paid services | `npm run build`; host works without backend |
| NFR-02 | Data processing deterministic and reproducible | Same input cache yields same output JSON and hash |
| NFR-03 | Accessible and responsive | Keyboard navigation, contrast/readability, 360px mobile |
| NFR-04 | Maintains science integrity | No fabricated data, missing-value checks, statistical assumptions |
| NFR-05 | Public repo contains license, source citations, reproducibility docs | Repo inspection |
| NFR-06 | Never claims AI model functionality unless shipped | Audit UI, README, pitch |

## 5. Constraints and assumptions
Three-person team, very short runway; hackathon judging deadline 2026-11-15 11:00 ICT; 0-cost hosting. NASA POWER MERRA-2 grid output is *not* an urban station measurement. Months may contain sentinel/missing values. No guarantee API is reachable at demo time; ship only verifiably sourced cached JSON. No long training jobs.

## 6. Data contract (proposed; freeze at design)
```json
{
  "locationId": "hanoi",
  "label": "Hanoi (grid point)",
  "latitude": 21.03,
  "longitude": 105.85,
  "variable": "T2M",
  "unit": "degC",
  "startYear": 1991,
  "endYear": 2024,
  "sourceUrl": "https://power.larc.nasa.gov/...",
  "processing": "day-weighted monthly T2M to annual means",
  "observations": [{"year": 1991, "value": null}],
  "trend": {"slopePerDecade": null, "pValue": null, "method": "OLS"}
}
```
Values shown as `null` are placeholders, **not** fabricated measurements.

## 7. Acceptance / Definition of Done
Every P0 requirement demonstrably works on deployed URL and in a captured backup recording; data provenance and method verifiable from repo; automated tests pass for numerical functions; no blocking UI errors; README and NASA attribution present; submission links verified.

## 8. Items requiring human sign-off (blocking only)
- Confirm public GitHub repository and Apache-2.0 license, as in original proposal.
- Confirm two site coordinates and annual window; default: Hanoi (21.03,105.85) and Can Tho (10.03,105.78), 1991–2024.
- Confirm project spelling on NASA submission: `TrendEarth AI`.
- Confirm exact local-team submission process in organizer announcement.

## 9. Change control
Post-signoff P0 scope changes require explicit technical lead approval. P1/P2 ideas go to backlog; no silently added dependencies or UI features.
