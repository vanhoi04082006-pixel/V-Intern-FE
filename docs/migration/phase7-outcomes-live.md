# Mentor and outcomes live slice

Mentor uses own conversation APIs with persisted user/assistant messages, explicit archive, pagination, and an honest AI503 state. The UI warns that the question may already have been saved before retrying. AI is advisory; no automatic score writes occur.

Evaluations, performance, KPI provenance, virtual salary ledger, certificates/PDF, notifications, recommendations, profile and anonymous verification read real Nest responses. Null metrics remain unavailable. No unrecorded ledger movements or synthetic trends are displayed. Notification API-era links are mapped to existing frontend routes; unknown or unsafe paths are rejected.

`phase7-outcomes-fixture.mjs` is disposable development/CI setup through real APIs. It demonstrates an AI suggestion95 followed by instructor score80 and finalization. `phase7-outcomes-live.mjs` runs without interception against real Next/Nest/SQL and verifies SQL score80, KPI94, ledger9400000, PDF signature, foreign ownership404, anonymous privacy and revocation. Test-only AI provider overrides are outside production app imports.

Local verification: SQL Server17 development engine, 247 frontend tests retained/passing, lint/typecheck/build/diff-check passing, four live browser groups passing. Final release requires the workflow's actual SQL Server2019 check and the complete Instructor/Admin journeys.

The private Backend checkout in FE CI uses a read-only repository deploy key and an encrypted Actions secret. Keys are never committed, logged or included in artifacts. CI pins an exact Backend SHA and generates masked disposable application/database credentials for every run.
