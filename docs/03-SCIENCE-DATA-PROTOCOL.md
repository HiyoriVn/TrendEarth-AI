# Scientific and data protocol · draft

## Grounding
Official NASA Space Apps challenge: https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/  
NASA POWER monthly API: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/

## Proposed observational unit
NASA POWER `T2M`: 2-m air temperature, NASA meteorological model/reanalysis-derived gridded data (not a street-level weather-station reading). Query a **point/grid-cell** near two Vietnam locations. Time span 1991–2024, yearly sample size at most 34.

## Reference requests (verify on ingestion)
```
https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M&community=SB&longitude=105.85&latitude=21.03&format=JSON&start=1991&end=2024
https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M&community=SB&longitude=105.78&latitude=10.03&format=JSON&start=1991&end=2024
```

## ETL rules
1. Request metadata and response; store source URL, access date, spatial resolution if provided, units, temporal coverage and relevant NASA attribution.
2. Match keys precisely (`YYYYMM` monthly values; check API metadata for annual keys). Do not double count annual summary values as months.
3. Treat missing-value sentinels and nulls as missing, never zero. Flag affected years. Prefer complete years; show excluded years openly.
4. If monthly values are monthly mean T2M in °C, annual mean = Σ(monthly mean × number of days in month) / Σ(days), **for all 12 valid months**. Confirm NASA aggregation definition before implementation.
5. OLS on `(year, annualMeanTemperature)` with slope °C/year multiplied by 10. Report n, p-value, fit line, optionally 95% CI with explicit assumptions. Use `scipy.stats.linregress` or a tested equivalent.
6. Consecutive annual observations can be autocorrelated. P-value from simple OLS is exploratory; do not claim robust climate attribution. Consider sensitivity/serial-correlation caveat.
7. Validate against synthetic reference series solely in automated tests; keep synthetic test data separate from app observations.
8. Output stable JSON with `sourceUrl`, `sourceDataset`, `latitude`, `longitude`, `variable`, `unit`, `years`, `trend`, `processing`, `retrievedAt`.

## Scientific claims policy
- 'At this NASA POWER grid location, T2M increased/decreased by an estimated X °C/decade during Y–Z' is acceptable if computed.
- 'The entire city warmed by X' and 'industrialization caused X' are unsupported.
- 'Significant' only describes the chosen test under assumptions, not practical impact or causal proof.
- Chart y-axis must specify °C, not show model prediction as observation.
- A sample of two grid points is **not** a Vietnam climate map.
