# KNOWN-ISSUES.md — Immo-App

Short-form log of open issues, confirmed bugs, spec gaps, and pending
features. Always read before any task in this project (see `AGENTS.md` →
Required reading).

Status legend:
- `confirmed bug` — verified incorrect behavior, fix needed
- `needs inspection` — suspected issue, requires code review to confirm
- `spec gap` — specification incomplete or ambiguous
- `pending feature` — agreed-upon work not yet implemented

Update this file when an item is resolved (mark `resolved <date>`) or when
new items are discovered during work.

---

## Calculation engine

### Year-one vacancy uses `max()` instead of `sum()`
- **Status:** resolved 2026-05-17
- **Source:** formula verification pass
- **Resolution:** active frontend calculation now sums regular annual vacancy
  and first-year initial vacancy, capped at 12 months, before computing the
  year-one effective rent.
- **Touches:** frontend/src/domain/finance/engine.ts

### Annual vs. monthly amortization calculation
- **Status:** resolved 2026-05-17
- **Source:** formula verification pass
- **Resolution:** active frontend calculation computes amortization monthly
  within each loan phase, then aggregates interest, regular principal,
  special principal payment, debt service, and end balance per year.
- **Touches:** frontend/src/domain/finance/engine.ts

### Selective financing basis logic
- **Status:** needs inspection
- **Source:** formula verification pass
- **Question:** logic that selects the financing basis (which costs are
  financed vs. paid from equity) requires review for correctness and
  edge-case handling
- **Next step:** code inspection against `bauanleitung.md` definitions
- **Touches:** backend calculation engine

### Break-even rent denominator missing rental default risk factor
- **Status:** resolved 2026-05-16
- **Resolution:** mietausfallwagnisSatz added to denominator of both
  breakEvenMieteProQmLiquiditaet and breakEvenMieteProQmWirtschaftlich.
  bausparvertragMonatlich also added to liquidität numerator.
  Formula: `(kosten + dienst) / (qm × 12 × (1-leerstand) × (1-maw))`
- **Touches:** frontend/src/domain/finance/kpis.ts

---

## Pending features

(empty)

---

## Resolved

### Bausparvertrag monthly rate as liquidity outflow
- **Status:** resolved 2026-05-16
- **Scope implemented (lightweight variant):**
  - monthly rate as a liquidity outflow field under laufende Kosten
  - yearly liquidity outflow in cashflow calculation (`bausparvertragMonatlich × 12`)
  - **not implemented by design:** full savings-to-loan lifecycle modeling,
    allocation phase, interest crediting, loan conversion
- **Touches:** frontend input/schema/domain calculation
