# TrendEarth AI — Agent Operating Rules

Read this file before any work. Root instruction applies to Codex, Gemini and other repo-aware assistants.

## Human context
Three-person hackathon team. User is both technical lead and visual designer; a teammate covers slides and pitch. Deadline for Hanoi judging is 11:00 ICT 2026-11-15. A working vertical slice and a correct submission outrank sophistication.

## Non-negotiables
1. **Scientific honesty:** Never invent data, p-values, source provenance, experiments or test passes. Explicitly mark mocks in development only; none in submitted scientific claims.
2. **Challenge alignment:** Variable selection, location, trend/magnitude and statistical significance must be visible and traceable to NASA Earth observation/model data.
3. **Scope lock:** MVP is T2M, 2 predefined sites, 1991–2024, annual chart, regression, p-value, source/limitations. Additional variables only after MVP acceptance.
4. **No LSTM/Transformer, DB, API server, auth, live map, payments, telemetry** unless explicitly requested after a demo is stable. 'AI' is project branding, not a model capability claim.
5. **Reproducibility:** Cache only real NASA responses; record API URL, accessed_at, units, source, coordinates, time coverage, missing value policy and transformation formula.
6. **No statistical overclaim:** Correct missing values (`-999` etc. per metadata). Day-weight annual temperatures; require complete/quality-approved years. `p < 0.05` is descriptive under model assumptions, not proof of causation. Explain spatial grid limitations and autocorrelation where applicable.
7. **Do not auto-deploy or publish** without technical lead approval. Never commit credentials or personal data. No force-push, destructive updates or dependency bloat.
8. **Code quality:** small testable units; lint/test/build where implemented; do not claim success without command output. Changes to numerical algorithms require unit tests against controlled inputs.
9. **Collaboration:** Each parallel agent owns distinct file paths, returns a summary/risks/files changed, and never blindly merges competing edits. Root/coordinator integrates.
10. **Language:** project UI/pitch in English; internal team documents may be Vietnamese; avoid marketing exaggeration.

## Stage gates
- Phase 0 setup: repo instructions, spec draft, issue backlog exist.
- Phase 1 requirements: technical lead approves SRS v1, fixed dataset and acceptance criteria.
- Phase 2 design: minimal UI flow and data JSON contract approved.
- Phase 3 build: E2E location → NASA series → regression stats → interpretation passes.
- Phase 4 QA: checks pass, production site and backup media verified, sources attributed.

## Agent routing / skills
- Product/spec tasks -> `.agents/skills/requirements-engineering/SKILL.md`
- NASA ingestion -> `.agents/skills/nasa-data-pipeline/SKILL.md`
- Trend stats -> `.agents/skills/scientific-validation/SKILL.md`
- Visual/UI -> `.agents/skills/frontend-visual-design/SKILL.md`
- Test/release -> `.agents/skills/quality-gate/SKILL.md`
- Pitch -> `.agents/skills/pitch-and-impact/SKILL.md`

Start by reading `docs/01-SRS-DRAFT.md`, `docs/02-BACKLOG.md`, `docs/07-DECISIONS-RISKS.md`. If a requirement is under discussion, propose a minimal ADR instead of silently deciding it.
