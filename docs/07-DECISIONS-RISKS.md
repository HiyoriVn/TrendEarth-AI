# Decision log and risk register

## Decision log
| ADR | State | Decision / rationale |
| --- | --- | --- |
| ADR-001 | PROPOSED | Static React/Vite + Chart.js and precomputed JSON; low failure risk and $0 hosting |
| ADR-002 | PROPOSED | NASA POWER T2M at two sites (1991–2024); one source, quick integration |
| ADR-003 | PROPOSED | OLS first; more elaborate climate statistics deferred and caveats disclosed |
| ADR-004 | PROPOSED | Apache-2.0 and public repository, per uploaded proposal; confirm with team |
| ADR-005 | PROPOSED | English demo, Vietnamese internal docs; no logo endorsement |

Do not mark proposed ADRs accepted without technical lead's signoff.

## Risks
| Risk | Severity | Mitigation |
| --- | --- | --- |
| 11:00 local deadline is missed | Critical | Submission freeze and backup before deadline, confirm local rules |
| Dataset API slow/unavailable | High | Precompute JSON after verifying NASA response; log provenance |
| Missing/invalid monthly samples | High | Reject incomplete years; explicit warning |
| Claim outstrips evidence | High | Science review, disclose spatial grid/OLS limits |
| Team of 3 overwhelmed | Critical | Scope lock and parallel bounded deliverables |
| Multiple agents overwrite changes | High | Path ownership, separate branches/PRs, coordinator integration |
| Agent tooling unavailable | Medium | Prompts work as manual work packets; no false auto-execution claim |
| New scope introduced late | High | P0 freeze; backlog P1/P2 only |
| Embedding NASA logos/third-party graphics incorrectly | Medium | Attribute sources and check reuse policy |
