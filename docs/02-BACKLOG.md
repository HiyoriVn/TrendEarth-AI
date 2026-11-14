# Prioritized engineering backlog

| ID | Stage | Task | Owner / lane | Depends on | Done when |
| --- | --- | --- | --- | --- | --- |
| B01 | Spec | Review SRS, resolve 4 blockers, freeze P0 | Technical lead | none | SRS status approved |
| B02 | Research | Verify NASA POWER monthly T2M response/schema and coverage | Data-agent | B01 | Real API sample/metadata recorded |
| B03 | Science | Specify missing-value, aggregation, regression assumptions | Science-agent | B01 | Scientific protocol reviewed |
| B04 | Design | UI wireframe, color tokens, mobile flow | Design-agent | B01 | Technical lead approves UX layout |
| B05 | Design | Freeze static JSON contract | Tech lead + data | B02,B03 | Sample schema validated |
| B06 | Implement | NASA ingestion + deterministic JSON export | Data-agent | B05 | Two site outputs generated from real data |
| B07 | Implement | React dashboard + Chart.js | Frontend-agent | B04,B05 | Both sites selectable & chart displays |
| B08 | Test | Unit checks: missing values, annual weighting, slope, p-value | QA-agent | B03,B06 | Tests pass, observed output logged |
| B09 | Integrate | End-to-end build, mobile / offline demo / source links | Tech lead | B06,B07,B08 | Deployable build |
| B10 | Submit | README, 5 slide script, video backup, NASA submission | Presenter + lead | B09 | Submission confirmation captured |

**Cut order if late:** remove animations, comparison extras and custom map before compromising provenance/statistics/submission. Stop adding features at the submission freeze.
