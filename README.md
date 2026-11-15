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

## Run the integrated MVP

Use Node.js 22+ and Python 3.12. From repository root:

```sh
python -m pip install -r pipeline/requirements.txt
python -m unittest discover -s tests -v
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run dev
```

Open the local URL printed by Vite. For a production check:
`npm --prefix frontend run build`, then `npm --prefix frontend run preview`.
Build synchronizes validated canonical JSON into public/data; output is
`frontend/dist`, including `data/hanoi.json` and `data/can-tho.json`.
No NASA network request occurs in the browser. See `pipeline/README.md` for
raw provenance, offline regeneration and the fixed scientific contract.

### Deployment settings (manual approval required)

Cloudflare Pages: repository root directory `/`; build command
`npm --prefix frontend ci && npm --prefix frontend run build`; output directory
`frontend/dist`. Node version 22. No environment secrets required.

Vercel: Root Directory `frontend`; framework Vite; install command `npm ci`;
build command `npm run build`; Output Directory `dist`. Enable access to files
outside the Root Directory because the build reads `../data/processed/`.
Alternatively use repository root with the Cloudflare command and output path.
Review the preview for both locations before approving production publication.
No deployment is performed by the CI workflows.

### 60-second demo

0–15s: Explain that TrendEarth AI helps students inspect NASA POWER temperature
series; AI is the project name, with no trained model in this MVP.
15–30s: Select Hanoi, point out annual observations, dashed OLS fit, rate per
decade and exploratory p-value. Switch to Can Tho; all panels update together.
30–45s: Open methods and source details; show the exact NASA URL, requested and
returned geometry, 34 complete years and day-weighted aggregation.
45–60s: Explain the conservative 30-year reporting policy and limitations:
classical p-values do not correct autocorrelation; one model point does not
establish citywide trends or causation. Close with reproducible static delivery.


## Interactive Climate Explorer (Issue #12)

Choose Single location or Compare Hanoi vs Can Tho, then Annual mean,
Temperature anomaly, or Trailing 5-year mean. Anomalies require all 30 complete
annual values in 1991–2020 for each site; no partial baseline is substituted.
Trailing windows include the displayed year and four preceding contiguous
complete years. These displays are descriptive only; OLS cards always refer to
original full-window annual means and fits are drawn only in annual mode.

Hover/focus/click a chart point or select a year in the inspector. Comparison
differences are Can Tho minus Hanoi for the same raw annual year. Download CSV
exports original annual values, coverage/exclusion status, exact source URLs
and access timestamps, regardless of chart display. Missing values remain empty.

Browser interaction checks: `npm --prefix frontend run test:browser` after
`npx --prefix frontend playwright install chromium` and the production build.
For an installed Edge executable, set EDGE_PATH to its full path. Unit tests
remain `npm --prefix frontend test`. Workers validation only (no deployment):
`npx wrangler deploy --dry-run --outdir .tmp/workers-check` after the build.
