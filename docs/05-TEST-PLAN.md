# Test plan & traceability · draft

## Unit science tests
- `T01`: 12 valid monthly values equal => identical annual mean (including leap years).
- `T02`: Missing sentinel/null or incomplete year => no silently fabricated annual mean.
- `T03`: Deliberately linear synthetic annual series slope and p-value checked against known results.
- `T04`: Flat annual series yields zero/near-zero slope and cautious significance text.
- `T05`: Null/insufficient observations => no test statistic falsely shown.
- `T06`: Generated JSON carries correct source URL, coordinates, units and coverage.

## Frontend tests
- `T07`: Toggle locations and confirm plotted numbers/source switch.
- `T08`: No network at runtime => reviewed, real cached data still loads.
- `T09`: Narrow mobile width 360px, keyboard focus, readable labels/contrast.
- `T10`: Empty and malformed data show explicit errors; app does not crash.
- `T11`: No UI claims LSTM/Transformer/causality/AI prediction unless delivered and validated.

## Release gate
1. Document exact commands and outputs (`python scripts/check_repo.py`, Python test runner, `npm test`, `npm run build`) when implemented.
2. At least one human visually inspects deployed site and verifies NASA provenance.
3. Re-run independent reference calculation or manually compare 3 annual means and slope against pipeline.
4. Record backup demo/video and submission confirmation.
5. Never mark a test PASS without executing it. Before code exists, all functional tests status is NOT RUN.
