# Project charter · draft v0.1

## Context
NASA Space Apps 2026 challenge **Be An Earth System Trend Detective!** seeks a tool to select Earth-system variables, visualize change over time, quantify trends and assess statistical significance. NASA-sourced data can be observed/model-derived. AI is optional; simple linear trends are an acceptable first approach. The supplied TrendEarth proposal lists a broad multi-source, LSTM/Transformer, FastAPI/React vision; **that is an initial ambition, not a feasible 3-person overnight scope**.

## Objective (MVP)
Within a web UI a non-expert selects Hanoi or Can Tho, explores an annual temperature time series derived from NASA POWER, sees the estimated rate of change and associated statistical test, and can discover the source and limitations.

## Success measure
A judge can independently open the app, switch locations, read a trend with units, inspect evidence and method, and view the code/docs. No claim needs unverifiable model training.

## Stakeholders
Technical lead (also visual), presenter/slides, third team contributor (role to confirm); judges; educators/students as target users. Do not claim user research interviews or field impact that did not occur.

## In / out
IN: two fixed locations, 1991–2024, T2M, annual means, OLS slope (°C/decade) and p-value, chart, explanation, citation, caveats, mobile-responsive, deployable static bundle.
OUT: live geographic raster, DB, login, advanced deep learning, projections, industrial policy recommendations, rainfall comparisons and causality claims.

## Decision ownership
Technical lead signs off functionality and scientific language; presentation owner signs off slide readability; QA reviewer signs off critical checks (may be same human due team size, but independent checklist required).
