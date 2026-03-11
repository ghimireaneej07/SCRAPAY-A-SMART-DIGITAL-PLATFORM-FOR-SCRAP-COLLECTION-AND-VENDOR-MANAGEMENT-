# Scrapay Production TODO

## Phase 1: Stabilize the Core Flow
- Replace demo-only pricing behavior with deterministic market rate delivery.
- Make frontend sell-flow state survive refresh and route reloads.
- Remove hardcoded client timezone assumptions from order creation.
- Tighten order form validation and prevent invalid submissions.
- Make backend tests run consistently without a local MySQL dependency.

## Phase 2: Harden Operations
- Add environment-specific Django security settings and deployment defaults.
- Add final pricing and rejection reason support to the vendor order flow.
- Add pagination and filters for high-volume admin, order, and notification views.
- Add stronger API validation around profile, upload, and search inputs.
- Add structured logging and health-check endpoints.

## Phase 3: Improve Product UX
- Refine user, vendor, and admin dashboards with clearer operational states.
- Improve empty, loading, and error states across all critical screens.
- Add durable order timeline and status change visibility in the UI.
- Improve notification surfacing and realtime reconnect behavior.
- Normalize visual system and layout spacing across pages.

## Phase 4: Production Readiness
- Add CI for backend tests and frontend lint/build.
- Add end-to-end tests for user, vendor, and admin journeys.
- Add deployment documentation for backend, frontend, Redis, and media.
- Add monitoring, alerting, and backup strategy.
