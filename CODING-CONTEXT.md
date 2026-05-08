# CODING-CONTEXT.md

## Purpose

This file defines the shared implementation context for coding workers in this project.

Use this file for:
- project architecture and domain logic
- important files and directories
- commands for development, build, test, and runtime work
- implementation constraints
- testing and verification expectations
- handover expectations for delegated implementation work

This file is worker-neutral and should be usable by both Claude Code and OpenCode.

## Project summary

Immo is a public residential property evaluation app for `immo.magicplanet.net`.

Core goals:
- transparent formulas
- explainable KPIs
- saved calculations via share ID
- clear separation between economic logic and tax logic
- public-safe share-link and delete behavior

## Architecture overview

The app is split into a React frontend and a Fastify backend.

Frontend responsibilities:
- public calculator UI
- user inputs and validation
- result presentation
- share-link and delete UX
- PDF-related user flows where applicable

Backend responsibilities:
- APIs
- calculation engine
- persistence
- share ID handling
- PDF-related backend logic
- protection of public-safe behavior

Persistence responsibilities:
- PostgreSQL stores application data
- saved calculations must remain consistent and retrievable by share ID
- deletion behavior must remain predictable and safe

Infrastructure responsibilities:
- Docker Compose manages the app runtime
- the app runs behind Nginx Proxy Manager
- runtime wiring must remain aligned with the deployed environment

## Important directories and files

Core app paths:
- `frontend/` — public calculator UI
- `backend/` — APIs, calculation engine, persistence, PDF-related backend logic
- `docker-compose.yml` — runtime wiring
- `.env` — runtime secrets and environment configuration
- `docs/plans/` — app-specific planning docs

Shared operational paths:
- `/home/martin/hermes-workspace/docs/handover/immo-latest.md` — rolling handover state for this project
- `/home/martin/hermes-workspace/docs/server-app-overview.md` — server/app/domain/container/path overview when relevant to cross-project context

## Working assumptions

Assume this project is production-relevant.
Prefer preserving current behavior unless the delegated task explicitly requires changing it.

Do not assume that a small change is harmless.
Be careful with:
- formula behavior
- persistence behavior
- share-link behavior
- delete behavior
- PDF generation behavior
- Docker/runtime configuration
- environment-dependent logic

Prefer small, verifiable changes over broad cleanup.

## Domain constraints

Maintain a clear separation between:
- economic logic
- tax logic

Do not:
- mix monthly operating cashflow with speculative appreciation outputs
- silently introduce nonsensical financing behavior
- change KPI meaning without explicitly preserving explainability
- broaden public share-link visibility or delete behavior without a clear requirement

Every relevant KPI should remain explainable by:
- formula
- meaning
- source inputs

If a change would blur the distinction between economic outputs and tax outputs, stop and narrow the scope.

## Implementation expectations

Keep implementation tightly scoped to the delegated request.

Prefer:
- minimal diffs
- local changes
- one clear implementation outcome per block
- a small touched-file set
- testable outcomes
- a reviewable partial completion boundary when the full feature is too large for one block

Avoid:
- speculative refactors
- broad cross-cutting cleanup
- touching unrelated files
- changing multiple subsystems without a clear need
- introducing silent behavior changes without surfacing them in the handover
- continuing into the next obvious step unless that next step was part of the delegated scope

If you must touch code outside the initially named target area for correctness, keep it minimal and explain it in the handover.

## Execution boundary

Stop at the scoped implementation and verification boundary unless the active task explicitly includes broader follow-up.

Do not automatically continue into:
- deploy/restart steps
- public runtime verification
- broader cleanup
- the next obvious feature block

Instead:
- finish the scoped implementation cleanly
- run the most relevant local verification inside scope
- report the exact next operational step

Preserve existing public behavior unless the delegated task explicitly requires behavior changes.

## Commands

Backend:
- `cd /srv/apps/immo/app/backend && npm run dev`
- `cd /srv/apps/immo/app/backend && npm run build`
- `cd /srv/apps/immo/app/backend && npm run test`

Frontend:
- `cd /srv/apps/immo/app/frontend && npm run dev`
- `cd /srv/apps/immo/app/frontend && npm run build`
- `cd /srv/apps/immo/app/frontend && npm run test`

Runtime:
- `cd /srv/apps/immo/app && docker compose up -d`
- `cd /srv/apps/immo/app && docker compose logs -f backend`
- `cd /srv/apps/immo/app && docker compose logs -f frontend`
- `cd /srv/apps/immo/app && docker compose build`

Use commands from the real target directory.
Do not assume frontend and backend share the same execution flow.

## Testing and verification expectations

For every meaningful code change:
- run the most relevant local build and test commands for the touched area
- prefer targeted verification before broad verification
- note what was actually run
- note what was not run if full verification was not practical

At minimum, verify against:
- requested scope
- likely regression surface
- formula correctness when calculations are affected
- persistence behavior when saved calculations are affected
- share-link and delete behavior when related code is touched

Do not claim completion without stating what was verified.

## Handover and checkpoint rule

For non-trivial delegated work blocks, update the rolling handover file at:

`/home/martin/hermes-workspace/docs/handover/immo-latest.md`

Do not append indefinitely to a long-running log.
Overwrite the latest-state handover file so coordination can resume quickly from the current implementation state.

A non-trivial delegated work block is any delegated implementation block that:
- touches more than one file, or
- affects more than one subsystem or layer, or
- spans more than one meaningful coding step, or
- may need recovery, continuation, or review after a worker stops

Update the handover only at reviewable checkpoints, block completion, or blocking interruption.
Avoid checkpointing tiny internal progress.

## Required handover contents

For each relevant checkpoint or delegated block, record:
- task or work block name
- timestamp
- current status (`done`, `partial`, `blocked`, or `paused`)
- concise summary of completed work
- touched files
- tests run and results
- remaining issues, blockers, or risks
- exact next recommended step
- whether user input is needed before continuing

Write the handover so orchestration can resume without rereading the full implementation history.

## Interruption handling

Worker usage may become temporarily unavailable because of pause, quota, rate-limit, or tool interruption.

Do not rely on being able to write a final handover immediately before stopping.

If a visible interruption or limit message appears and the worker can still respond:
- record the latest completed state
- record the exact next recommended step
- record blockers or unresolved risks
- record the known wait time if one is shown

## Scope discipline

Stay inside the delegated scope.

Do not broaden scope without a clear reason.
Do not touch files outside the agreed target area unless:
- required for correctness, and
- easy to justify in the handover

Prefer changes that are:
- small
- explicit
- verifiable
- reversible where possible

## Response expectations for delegated work

When finishing a delegated work block, provide output that makes review easy.

Always summarize:
- what changed
- which files were touched
- what was tested
- what remains open
- what the next best step is

If blocked, say so clearly rather than improvising a broader change.
