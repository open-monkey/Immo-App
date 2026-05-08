# Immo KPI Spec: Rendite- und Steuerkennzahlen

> For Hermes: This is a KPI specification and scoping document. Use it to define implementation blocks, not to auto-start coding.

Goal: Standardize which return and tax KPIs belong in the Immo app, how they are calculated, where they appear in the UI, and what must explicitly stay separated.

Architecture: Keep three layers cleanly separated: object economics, financing/leverage, and tax effects. Do not let labels like "Rendite" hide different denominators or mix tax logic into operating KPIs.

Tech Stack context: React + TypeScript + Vite frontend, Fastify + TypeScript backend, PostgreSQL persistence, public share-link flow.

---

## Why this spec exists

The source spreadsheet uses several KPI labels that are common in German real-estate practice but often inconsistent in meaning:
- Bruttorendite
- Nettorendite
- Objektrendite
- Eigenkapitalrendite
- Abschreibung

Without a hard KPI spec, the app will drift into Excel chaos:
- similar names with different formulas
- one KPI based on Kaufpreis, another on Gesamtinvest, another on Eigenkapital
- financing mixed into object quality
- tax effects mixed into monthly profitability

This spec fixes that before implementation.

---

## KPI model: the three layers

### Layer A — Objektwirtschaftlichkeit

These KPIs answer:
- Is the property itself economically attractive?
- How strong are rent vs. total investment and owner-side running costs?

Allowed here:
- purchase price
- acquisition costs
- renovation costs
- cold rent
- vacancy assumption
- non-apportionable owner costs
- maintenance reserve
- administration costs
- other owner-side operating costs

Not allowed here:
- loan interest
- loan repayment
- debt schedule
- tax rate
- depreciation
- appreciation assumptions

### Layer B — Finanzierung & Hebel

These KPIs answer:
- What does this deal do to the investor's actual money and monthly burden?
- How hard does leverage work for or against the user?

Allowed here:
- debt amount
- equity amount
- monthly rate
- monthly cashflow
- equity-based return metrics

Not allowed here:
- depreciation
- tax savings
- appreciation assumptions

### Layer C — Steuer

These KPIs answer:
- What is the tax-side effect of the asset?
- How much annual relief or burden results from depreciation and financing cost deductibility?

Allowed here:
- building share / land split
- depreciation basis
- annual depreciation (AfA)
- tax rate
- annual tax effect

Not allowed here:
- folding tax benefit into cashflow or object yield labels
- presenting appreciation as if it were operating income

---

## Final KPI decisions

### 1) Bruttomietrendite

Decision: Keep it.

Status:
- already implemented
- remains a primary object KPI

Definition:
- Bruttomietrendite = Jahreskaltmiete / Gesamtinvest × 100

Formula:
- annualColdRent = coldRentMonthly × 12
- grossYieldPercent = annualColdRent / totalInvestment × 100

Inputs needed:
- coldRentMonthly
- totalInvestment

Display section:
- Objektwirtschaftlichkeit

Display priority:
- primary

Tooltip guidance:
- Shows rent power before owner-side running costs.
- Good as a first orientation, but optimistic on its own.

Explicit exclusions:
- no owner operating costs
- no financing costs
- no tax effects

---

### 2) Nettomietrendite

Decision: Add now.

Reason:
- already present in the MVP plan
- materially improves decision quality
- fits the current app state and existing inputs
- should sit directly next to Bruttomietrendite

Canonical label:
- Nettomietrendite

Definition:
- Nettomietrendite = Jahresreinertrag / Gesamtinvest × 100

Canonical annual net income definition:
- Jahresreinertrag = Jahreskaltmiete
  - Leerstandskosten p.a.
  - nicht umlagefähige Kosten p.a.
  - Instandhaltung p.a.
  - Verwaltung p.a.
  - sonstige Eigentümerkosten p.a.

Formula:
- annualColdRent = coldRentMonthly × 12
- annualVacancyCost = coldRentMonthly × vacancyRate / 100 × 12
- annualOwnerCosts =
  (nonApportionableCostsMonthly
  + maintenanceReserveMonthly
  + adminCostsMonthly
  + otherMonthlyCosts) × 12
- annualNetOperatingIncome = annualColdRent - annualVacancyCost - annualOwnerCosts
- netYieldPercent = annualNetOperatingIncome / totalInvestment × 100

Inputs needed:
- coldRentMonthly
- vacancyRate
- nonApportionableCostsMonthly
- maintenanceReserveMonthly
- adminCostsMonthly
- otherMonthlyCosts
- totalInvestment

Display section:
- Objektwirtschaftlichkeit

Display priority:
- primary

Tooltip guidance:
- More realistic than gross yield because owner-side running costs are deducted.
- Still measures the property, not the financing.

Explicit exclusions:
- no monthly loan rate
- no interest deduction
- no repayment
- no tax effects
- no appreciation

Important naming rule:
- If the app shows "Nettomietrendite", it must always mean the formula above.
- No switching denominator between Kaufpreis and Gesamtinvest.

---

### 3) Objektrendite

Decision: Do not introduce as a separate KPI in v1.

Reason:
- In practice the term is too fuzzy.
- In spreadsheets it often duplicates gross or net yield with a different label.
- It creates fake precision while usually hiding denominator drift.

Rule:
- If stakeholders want the wording "Objektrendite", use it only as an alias for one explicitly defined KPI.
- Preferred approach for the app: do not use the label at all in v1.

Fallback option if product wants it later:
- label: "Objektrendite (netto)"
- formula: identical to Nettomietrendite
- only acceptable if denominator remains totalInvestment

Explicit no-go:
- no extra KPI named "Objektrendite" with a near-duplicate formula

---

### 4) Eigenkapitalrendite

Decision: Add, but with a strict and simple definition.

Canonical label:
- Eigenkapitalrendite (vor Steuern)

Recommended user-facing helper label:
- Eigenkapitalrendite / Cash-on-Cash

Definition:
- Eigenkapitalrendite = jährlicher Cashflow vor Steuern / eingesetztes Eigenkapital × 100

Formula:
- annualPreTaxCashflow = monthlyCashflow × 12
- equityReturnPercent = annualPreTaxCashflow / equityAmount × 100

Inputs needed:
- monthlyCashflow
- equityAmount

Display section:
- Finanzierung & Hebel

Display priority:
- secondary in overall summary, primary within financing block

Tooltip guidance:
- Shows how the investor's own money performs after debt service and running costs.
- Strong leverage can raise or crush this KPI.

Explicit exclusions:
- no repayment treated as profit
- no tax benefit
- no appreciation
- no principal reduction as hidden return component

Why this version is preferred:
- simple
- explainable
- honest
- directly tied to investor reality

What is explicitly rejected in v1:
- Eigenkapitalrendite including tax effect
- Eigenkapitalrendite including appreciation
- Eigenkapitalrendite including debt paydown as profit

Those variants may exist later as advanced metrics, but not under the same label.

---

### 5) Abschreibung / AfA

Decision: Important, but not now in the current summary block.

Canonical label:
- jährliche AfA

Definition:
- tax-side annual depreciation on the depreciable building basis

Why it matters:
- It is a core tax KPI.
- It changes annual taxable result materially.

Why it does NOT belong in the current overview:
- current app inputs do not yet define a tax-safe AfA basis
- purchase price is not automatically depreciable in full
- land/building split is required
- renovation treatment may differ
- mixing it into current yield/cashflow view would corrupt explainability

Future tax-layer formula shape:
- buildingValueBasis = totalRelevantAcquisitionBasis × buildingSharePercent
- annualDepreciation = buildingValueBasis × afaRatePercent / 100

Minimum future inputs required:
- personalTaxRate
- buildingSharePercent or explicit building/land split
- afaRatePercent or governed AfA logic by building type/year
- optional handling rule for renovation capitalization if later supported

Display section:
- Steuer

Display priority:
- primary within tax block
- not shown in object or financing block as if it were operating return

Explicit exclusions:
- no AfA inside monthly cashflow
- no AfA inside Nettomietrendite
- no AfA inside Eigenkapitalrendite in v1

---

## Recommended summary layout

### Block 1 — Objektwirtschaftlichkeit

Primary KPIs:
- Bruttomietrendite
- Nettomietrendite
- Mindestmiete / qm
- Kaufpreis / qm
- Gesamtinvest / qm

Optional supporting KPI:
- Jahresreinertrag

### Block 2 — Finanzierung & Hebel

Primary KPIs:
- Eigenkapital
- Fremdkapital
- Monatsrate
- monatlicher Cashflow
- Eigenkapitalrendite (vor Steuern)

Optional supporting KPI:
- Cashflow p.a.

### Block 3 — Steuer

Later phase only:
- AfA-Basis
- jährliche AfA
- steuerlicher Überschuss/Verlust p.a.
- steuerlicher Effekt p.a.

---

## Data-model additions required

### Add to backend summary model soon

Add:
- annualColdRent
- annualOwnerCosts
- annualNetOperatingIncome
- netYieldPercent
- annualPreTaxCashflow
- equityReturnPercent

Reason:
- these are explainability-friendly
- tooltips and future PDF/export need auditable intermediate values
- easier to test than only exposing final percentages

### Keep existing fields

Keep:
- totalInvestment
- equityAmount
- debtAmount
- grossYieldPercent
- monthlyRate
- monthlyCashflow
- minimumRentMonthly
- minimumRentPerSqm
- annualVacancyCost

### Do not add yet

Do not add to current summary model yet:
- annualDepreciation
- taxEffect
- appreciationReturn
- IRR-style metrics

---

## Naming and denominator rules

These rules are mandatory.

### Denominator rule

Use these denominators consistently:
- Bruttomietrendite -> totalInvestment
- Nettomietrendite -> totalInvestment
- Eigenkapitalrendite -> equityAmount

Do not switch to purchasePrice for one yield and totalInvestment for another unless the UI explicitly says so.

### Label rule

Each label maps to one formula only:
- Bruttomietrendite != Nettomietrendite
- Nettomietrendite != Eigenkapitalrendite
- Abschreibung != Rendite

### Separation rule

Never mix:
- object yield with financing burden
- financing return with tax benefit
- appreciation upside with monthly operating results

---

## Tooltip draft texts

### Bruttomietrendite
"Bruttomietrendite = Jahreskaltmiete / Gesamtinvest × 100. Zeigt die Mietleistung des Objekts vor laufenden Eigentümerkosten und vor Finanzierung."

### Nettomietrendite
"Nettomietrendite = Jahresreinertrag / Gesamtinvest × 100. Vom Mietertrag werden Leerstand und laufende Eigentümerkosten abgezogen. Finanzierung und Steuern sind hier bewusst nicht enthalten."

### Eigenkapitalrendite
"Eigenkapitalrendite (vor Steuern) = jährlicher Cashflow / eingesetztes Eigenkapital × 100. Zeigt, wie stark dein eigenes Geld nach Rate und laufenden Kosten arbeitet."

### jährliche AfA
"Die AfA ist die jährliche steuerliche Abschreibung des Gebäudeanteils. Sie senkt nicht den realen Geldabfluss, kann aber das steuerliche Ergebnis verbessern."

---

## Implementation priority recommendation

### Next implementation block

Scope:
- add netYieldPercent
- add annualNetOperatingIncome
- add equityReturnPercent
- restructure summary UI into object vs financing sections
- add explainability text/tooltips for new KPIs

Why this block first:
- high product value
- low conceptual risk
- consistent with current MVP phase
- no tax model required yet

### Explicitly out of scope for that block

- AfA logic
- tax rate inputs
- tax effect display
- appreciation assumptions
- scenario engine
- PDF changes unless needed only for field pass-through

---

## Acceptance criteria for the future implementation block

1. The summary distinguishes object economics from financing metrics.
2. Nettomietrendite is visible and formula-consistent.
3. Eigenkapitalrendite is visible and clearly marked as pre-tax.
4. No KPI label called "Objektrendite" exists unless it is a documented alias.
5. No tax metric appears in the current overview block.
6. Tooltips explain formula, meaning, and exclusions.
7. Backend tests cover the new KPI formulas with a known fixture.
8. Frontend tests cover rendering of the new KPI labels and values.

---

## Short product answer

What makes sense now:
- Bruttomietrendite
- Nettomietrendite
- Eigenkapitalrendite (vor Steuern)

What should wait:
- Abschreibung / AfA
- tax effect

What should be avoided as a separate KPI unless tightly defined:
- Objektrendite

That keeps the app understandable instead of turning it into a spreadsheet with commitment issues.
