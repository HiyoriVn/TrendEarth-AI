# Agent orchestration playbook

## Important limitation
The files in `.ai-prompts/` and `.agents/skills/` **do not spawn agents**. Parallel work requires a supported Codex/Gemini/other multi-agent runtime and user access. This repository provides task contracts for compatible tools or separate coding sessions.

## Coordinator instructions
- Read `AGENTS.md` and SRS. Do not start P0 implementation until scope approved; once approved, run independent streams concurrently.
- Assign **disjoint write areas**: NASA research/ETL -> `pipeline/`, `data/metadata/`; UI -> `frontend/`; statistical review -> `tests/` and science docs; pitch -> `docs/06-PITCH-SUBMISSION.md`.
- The coordinator owns shared `README.md`, `AGENTS.md`, schema contract, and merges. Agent cannot edit outside allocated paths without approval.
- Every agent returns: (a) files changed, (b) evidence/commands, (c) known risks, (d) integration notes, (e) any unverified statements.
- Use 3 focused streams maximum initially; more agents cause contention and context cost.

## Streams
**Stream A — Data & methods:** verify NASA POWER format/metadata, make source protocol and later ETL; do not edit UI.
**Stream B — UX & frontend:** draft static UI with a typed JSON contract, accessible charts; do not invent measurements or call API with secrets.
**Stream C — QA & science audit:** independent methodology assessment, acceptance tests and release checklist; do not implement competing pipeline.
**Presenter/slides** is human-led, assisted by specialized pitch skill.

## Phased parallelism
1. **Spec phase now:** A reviews exact NASA dataset, B proposes 1-screen UX, C reviews assumptions and acceptance; coordinator merges into SRS and obtains signoff.
2. **Build phase after signoff:** A implements ETL, B implements frontend against agreed JSON, C authors tests. No shared-file writes.
3. **Integration phase:** coordinator freezes dataset schema, tests source provenance, runs CI/build, fixes critical failures, prepares submission.

## Example root-agent prompt
> Read AGENTS.md, docs/01-SRS-DRAFT.md and docs/08-AGENT-ORCHESTRATION.md. If subagents are supported, delegate three bounded read-only audits in parallel: NASA POWER dataset risks, UX acceptance flow, scientific statistics. Do not edit shared files, fabricate results, or claim agents ran if delegation tools are unavailable. Reconcile findings into SRS change suggestions; await scope approval before implementation.
