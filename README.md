# TrendEarth AI

**Discover the change. Understand the evidence.**

NASA Space Apps Challenge 2026 — *Be An Earth System Trend Detective!*  
Status: **Phase 0 / engineering setup**. No scientific results or application implementation yet.

## Mission
Build a reproducible, accessible Earth-science trend explorer. Users can choose an environmental variable and a location, visualize historical NASA-derived data, estimate its trend, and see whether the detected change is statistically supported.

## Hackathon operating constraints
- Three humans: (1) technical lead + visual design, (2) slides and presentation, (3) supporting contributor as available; do **not** assume five engineers.
- Hanoi judging submission deadline: **2026-11-15 11:00 ICT (UTC+7)**; confirm any new organizer announcements. Global NASA submission is listed as 23:59 local on Nov 15.
- Working budget $0, no paid cloud or secret credentials required for the MVP.
- MVP: two fixed locations (Hanoi and Can Tho), monthly NASA POWER `T2M` data processed to annual observations (1991–2024), chart, linear slope per decade, p-value with limitations, plain-language explanation.
- No fictitious scientific observations, fabricated claims, or unexplained use of the word 'AI'.
- App delivery uses static precomputed, traceable JSON; React/Vite preferred **after** specification/design sign-off.

## Workflow
1. **Requirements** — `docs/01-SRS-DRAFT.md` (review open questions; set acceptance criteria).
2. **Design** — `docs/04-DESIGN-BRIEF.md` and one-page technical design (no feature expansion).
3. **Implementation** — real NASA data pipeline + interactive frontend.
4. **Verification** — `docs/05-TEST-PLAN.md`; reproducible results and smoke demo.
5. **Submission** — `docs/06-PITCH-SUBMISSION.md`.

This is a **compressed, iterative engineering process**, not a full enterprise waterfall. The minimum vertical slice must be functional before embellishments.

## Repo map
- `AGENTS.md`, `GEMINI.md`: durable instructions for coding assistants.
- `.agents/skills/`: 6 locally authored project-specific skills.
- `docs/`: charter, specification draft, scope, design, science, QA, pitch and governance.
- `.codex/agents/` and `.codex/config.toml`: 3 project-specific Codex subagent definitions (requires supported runtime).
- `.ai-prompts/`: scoped parallel-work agent prompts; no automatic execution.
- `SETUP_WINDOWS_POWERSHELL.md`: shortest GitHub handoff and optional PowerShell push.
- `data/`, `pipeline/`, `frontend/`, `tests/`: planned implementation areas, initially placeholders.
- `.github/workflows/`: lightweight documentation integrity check.

## Before coding
Review `docs/01-SRS-DRAFT.md` and `docs/07-DECISIONS-RISKS.md`; answer only the blocking decisions. No automatic deployment, scientific claim, external API key, or costly operation without approval.

## Official sources
- [NASA Space Apps challenge](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/)
- [NASA POWER monthly API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/)
- [Space Apps Hanoi agenda](https://eventstem.com/spaceapps.html)

## License
Apache-2.0 (see `LICENSE`). Do not copy NASA branding, partner logos or third-party images without checking permissions. NASA data provenance and source attribution are mandatory.
