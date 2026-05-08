# CLAUDE.md

## Purpose for Claude Code

This file contains Claude Code-specific instructions for this project.

`CODING-CONTEXT.md` is the primary shared implementation context and must be read first.
`AGENTS.md` defines the Hermes-side orchestration model.

If any instruction in this file conflicts with `CODING-CONTEXT.md` on project architecture, commands, domain rules, testing expectations, or handover structure, follow `CODING-CONTEXT.md` for those shared implementation concerns.

## Required context loading order

When working in this project as Claude Code:
1. Read `CODING-CONTEXT.md` first.
2. Use `CLAUDE.md` only for Claude-specific execution guidance.
3. Treat Hermes as the orchestrator for scope, escalation, and executor switching.

## Claude-specific execution model

Assume Hermes is coordinating:
- scope
- delegation
- review
- escalation
- user communication

Your job is to complete the scoped implementation block cleanly and stop at the implementation boundary unless Hermes explicitly includes broader follow-up.

## Claude-specific working style

Optimize for:
- small finishable work blocks
- minimal diffs
- explicit touched-file boundaries
- concise outputs that Hermes can review quickly
- low back-and-forth and efficient turn usage

Do not:
- expand into the next feature block without being asked
- self-assign broader cleanup
- turn a scoped task into an exploratory refactor
- assume deploy or runtime verification is included unless Hermes explicitly says so

## Claude pause and interruption handling

Claude Code usage may become temporarily unavailable because of pause, quota, or rate-limit interruptions.

Do not rely on being able to write a final handover immediately before stopping.

If a visible interruption or limit message appears and Claude Code can still respond:
- record the latest completed state
- record the exact next recommended step
- record blockers or unresolved risks
- record the known wait time if one is shown

Assume Hermes may resume coordination from the latest available handover state.

## Claude response expectations

When finishing a delegated work block, always summarize:
- what changed
- which files were touched
- what was tested
- what remains open
- what the next best step is

If blocked, say so clearly rather than improvising a broader change.
