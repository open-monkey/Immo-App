# Immo App Build Workflow Plan

> For Hermes: This is the implementation workflow plan for building the app. Do not start execution until Martin explicitly approves the build workflow.

Goal: Build `immo.magicplanet.net` in controlled phases so the app becomes usable early, formulas stay auditable, and public share-link behavior is safe and understandable.

Architecture: Use the same deployment pattern as Statistik/Taskforce: React + TypeScript + Vite frontend, Fastify + TypeScript backend, PostgreSQL, Docker Compose, Nginx Proxy Manager. Build the app vertically in slices: data model first, then calculation engine, then UI flow, then persistence, then PDF export, then deployment.

Tech Stack: React 18, TypeScript, Vite, React Router, TanStack Query, Fastify, PostgreSQL 16, PDF generation backend-side, Docker Compose.

Recommended app path: `/srv/apps/immo/app`
Domain: `immo.magicplanet.net`

---

## Build philosophy

- Build the app in vertical slices, not as isolated frontend/backend piles.
- Make formulas correct before making the UI pretty.
- Keep economic logic and tax logic separate in code and UI.
- Make every meaningful derived number reproducible.
- Get to a working internal version quickly, then widen scope.

---

## Planned build order

### Phase 0 — App skeleton and deployment base

Purpose:
- create the new app structure
- boot frontend/backend/db locally in Docker
- prepare the future domain hookup cleanly

Deliverables:
- `/srv/apps/immo/app/docker-compose.yml`
- `/srv/apps/immo/app/backend/`
- `/srv/apps/immo/app/frontend/`
- `.env.example`
- health endpoints
- initial `CLAUDE.md`

Done when:
- frontend starts
- backend starts
- db connects
- app can be reached locally on its mapped port

### Phase 1 — Data model and persistence shell

Purpose:
- define what one calculation is
- store and retrieve calculations by share ID

Deliverables:
- DB migration for `property_calculations`
- backend route to create calculation
- backend route to fetch calculation by share ID
- backend route to delete calculation
- generated public share ID logic

Done when:
- a raw calculation can be created, loaded, and deleted through API

### Phase 2 — Core calculation engine

Purpose:
- calculate the base economic KPIs correctly before UI complexity grows

Deliverables:
- acquisition cost calculations
- total investment calculations
- equity/debt calculations
- gross yield calculation
- financing calculations:
  - monthly rate
  - initial interest/principal split
  - debt after 10 years
  - debt after fixed-interest period
- operating cost calculations
- monthly cashflow
- net rental yield
- minimum required rent

Done when:
- backend returns stable KPI results for a known input set
- formulas are unit-tested

### Phase 3 — Step-based frontend flow

Purpose:
- make the app actually usable by humans

Deliverables:
- multi-step form UI
- step 1 object/acquisition inputs
- step 2 financing inputs
- step 3 operating cost inputs
- first live overview after step 1
- final summary after steps 1–3

Done when:
- a user can enter a calculation from browser and see the first real KPI set

### Phase 4 — Formula explainability layer

Purpose:
- make every important input and KPI auditable

Deliverables:
- reusable info-tooltip component
- explanation content for all relevant fields
- explanation content for major KPIs
- formula text + meaning + small example

Done when:
- a user can understand where the number comes from without opening the code

### Phase 5 — Tax module

Purpose:
- add simplified but explicit tax logic without corrupting the core economic model

Deliverables:
- tax input step
- depreciation basis logic
- annual AfA
- tax effect p.a.
- separate tax section in results

Done when:
- tax numbers are shown separately from cashflow numbers
- appreciation is not mixed into monthly profitability

### Phase 6 — Scenario engine and decision layer

Purpose:
- move from calculator to decision tool

Deliverables:
- conservative / realistic / optimistic scenarios
- scenario-adjusted KPI outputs
- ampel logic
- risk-driver explanation

Done when:
- user sees not only one result, but how fragile or robust the deal is

### Phase 7 — PDF export and shareable reopening

Purpose:
- make results portable and reusable

Deliverables:
- stable share-link route `/calc/:shareId`
- PDF export of one calculation
- delete action that removes saved calculation and invalidates link

Done when:
- a user can save, reopen, export, and delete a calculation end-to-end

### Phase 8 — Domain rollout and production hardening

Purpose:
- make the app production-ready on your server

Deliverables:
- final compose/runtime verification
- NPM proxy config for `immo.magicplanet.net`
- body-size / proxy sanity checks if needed
- backup/update of server app overview

Done when:
- public domain works
- app survives restart
- app mapping is documented in server overview

---

## Testing strategy

### Backend
- unit tests for core formula functions
- unit tests for financing logic
- unit tests for tax logic
- API tests for create/load/delete calculation

### Frontend
- tests for step transitions
- tests for summary rendering
- tests for tooltip visibility
- tests for scenario display

### Integration
- create calculation
- reopen via share link
- export PDF
- delete calculation
- verify deleted link no longer works

---

## Handover discipline during build

For every meaningful Claude Code block during implementation:
- use a handover file under `/home/martin/hermes-workspace/docs/handover/`
- record touched files
- record test/build status
- record remaining work
- record risks or assumptions

This app must not depend on hidden session memory because formulas and decision logic are too sensitive for that nonsense.

---

## Key guardrails while building

- Do not build the tax logic before the base economic engine is trusted.
- Do not build PDF export before the result model is stable.
- Do not connect the public domain before create/load/delete behavior is correct.
- Do not allow flexible financing phases to produce nonsensical negative repayment without validation.
- Do not let value appreciation dominate the recommendation logic.

---

## Short answer: how the app will be built

The build workflow is:
1. skeleton
2. database + share-link persistence
3. calculation engine
4. step form UI
5. formula help layer
6. tax module
7. scenario/ampel logic
8. PDF + reopen/delete
9. domain rollout

That order keeps risk low and gets to a useful version early.
