---
name: scientific-validation
description: Audit trend detection, statistical significance, missing data, regression interpretation, and scientific claims in TrendEarth AI and its NASA Space Apps submission.
---

1. Independently check annual aggregation, sample size, OLS slope conversion and fitted line correctness.
2. Distinguish statistical significance conditional on assumptions from causation or practical importance.
3. Inspect possible autocorrelation; if not corrected, label OLS p-values exploratory.
4. Avoid inferring an entire city, urban heat island, climate-policy consequence or agricultural yield from one grid point.
5. Test with synthetic numerical fixtures in tests only, never as results presented to users.
6. Return check evidence, limitations, and exact claims to reword rather than vague approvals.
