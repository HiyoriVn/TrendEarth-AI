# Visual & interaction design brief · pending design phase

## UX goals
Accessible to a non-specialist. A first-time visitor reaches a science-backed result in at most three interactions; dataset provenance visible without leaving the page. Layout works on mobile. English UI for judging.

## Required screen (one-page MVP)
1. Header `TrendEarth AI` / simple product tagline; no false NASA endorsement.
2. Selector row: location [Hanoi / Can Tho], variable [Air temperature at 2m — T2M], range [1991–2024 fixed].
3. Center chart: yearly temperature + independently computed trend line; unit °C.
4. Stat blocks: slope per decade, p-value, sample count, limitation note.
5. Insight card: neutral template-based text grounded in computed values.
6. Provenance: NASA POWER API link + methodology + source/date/coordinates.
7. Explicit loading/error/empty states and mobile view.

## Visual tokens (proposal; sign-off later)
- Background: #081426; elevated surface: #12345B; aqua accent: #36C9D6; text: #EAF3F8; caution amber: #F5B971.
- Strong readable typographic hierarchy; default web-safe fonts or properly licensed installed fonts.
- Graph clarity beats decoration. Avoid gratuitous animated globes, starfield particles, impossible satellite imagery overlays.
- Hero and diagrams are illustrative only; scientific visualizations must use actual data.

## Deliverables
- Low-fidelity wireframe (phone + desktop), high-fidelity one-page dashboard mockup, cover visual without inaccurate data or NASA logo use, 4-step pipeline diagram.
- Source visuals stored under `assets/` later with license/attribution note.

## Review checklist
[ ] Title and selectors understandable [ ] Clear units and legend [ ] Scientific notes visible [ ] 360px no horizontal overflow [ ] Contrast/keyboard [ ] Chart non-misleading [ ] No fake numbers in design promoted to final.
