---
name: nasa-data-pipeline
description: Investigate, ingest, verify, and preprocess NASA POWER Earth-system time-series data with traceable metadata and reproducible outputs for TrendEarth AI.
---

1. Use official NASA POWER monthly API documentation and confirm actual response metadata.
2. Verify `T2M` units, time key formats, missing sentinel, spatial grid/model and monthly-vs-annual values.
3. Save exact request URL, retrieved timestamp and transform details in metadata; no fabricated raw/derived output.
4. Exclude incomplete years rather than silently filling them; day-weight monthly T2M where scientifically valid.
5. Emit stable JSON after data contract approval; keep raw data and large caches out of git.
6. Add determinism checks and descriptive errors when API fails; do not create a paid/backend dependency.
