# Immo App MVP Plan

> For Hermes: Use writing-plans and subagent-driven-development only after Martin approves this scope. Do not start implementation from this file automatically.

Goal: Build a public web app at `immo.magicplanet.net` that helps evaluate whether a residential property purchase is financially attractive, shows every important KPI transparently, explains each field/formula via info icons, and allows export as PDF plus shareable revisit links.

Architecture: Reuse the proven app stack from Statistik/Taskforce: React + TypeScript + Vite frontend, Fastify + TypeScript backend, PostgreSQL database, Docker Compose deployment behind Nginx Proxy Manager. The MVP is public without login. Calculations are stored server-side and reopened via shareable links.

Tech Stack: React 18, TypeScript, Vite, React Router, TanStack Query, Fastify, PostgreSQL 16, PDF generation on backend, Docker Compose, Nginx Proxy Manager.

Domain: `immo.magicplanet.net`
Recommended app path: `/srv/apps/immo/app`
Recommended compose project name: `immo-app`

---

## Product goal of v1

The MVP is not an Excel clone. It is a structured decision tool with:
- guided multi-step input
- transparent formulas
- explainable KPIs
- simple decision support (green / yellow / red)
- persistent share links
- PDF export of one calculation
- full reset/delete of current calculation inputs

The app must separate:
- operational/economic view (cashflow, rent, financing, costs)
- tax view (AfA, tax rate, annual taxable effect)
- scenario view (conservative / realistic / optimistic)

---

## User workflow

1. User opens the public app.
2. User starts a new calculation.
3. User enters step 1 base data:
   - purchase price
   - square meters
   - rent
   - acquisition costs
   - equity / subsidy
4. App immediately shows a first overview.
5. User continues with financing details.
6. User continues with operating costs and vacancy assumptions.
7. User optionally adds tax inputs:
   - tax rate
   - land/building split basis
   - depreciation setup
   - optional value appreciation assumptions
8. App computes all KPIs and decision signals.
9. User can:
   - export PDF
   - copy share link
   - reopen the calculation later through the link
   - delete/reset the current calculation

---

## Explicit v1 scope

Required:
- public access without login
- one saved calculation per generated share ID
- step-based form flow
- info icon next to each field with formula/meaning/help text
- first overview after base inputs
- economic KPIs
- tax KPIs (basic, transparent, not overengineered)
- scenario comparison
- PDF export
- share link reopening the exact saved calculation
- delete button that removes the saved calculation state

Not in v1:
- user accounts
- multi-user ownership
- portfolio aggregation
- bank offer comparison across multiple loans
- automated Bodenrichtwert API integration
- full legal/tax advisory complexity
- advanced subsidy engine with many program types

---

## Product structure

## Step 1 — Objekt & Kaufdaten

Fields:
- Kaufpreis
- Wohnfläche qm
- Kaltmiete pro Monat
- optional: Kaltmiete pro qm (auto-derived if monthly is entered)
- Grunderwerbsteuer (percent or amount toggle)
- Makler (percent or amount toggle)
- Notar & Grundbuch (percent or amount toggle)
- Umbaukosten (amount or €/qm toggle)
- Eigenkapital (amount or percent toggle)
- Förderung (amount, v1 simplified)

Immediate outputs after step 1:
- Gesamtkosten
- Gesamtkapitalbedarf
- Eigenkapitaleinsatz
- Fremdkapitalbedarf
- Kaufpreis pro qm
- Gesamtinvest pro qm
- Bruttomietrendite

## Step 2 — Finanzierung

Fields:
- Sollzins
- anfängliche Tilgung
- Zinsbindung in Jahren
- optional Sondertilgung pro Jahr
- optional Anschlusszins nach Ende Zinsbindung
- optional expert mode phase model:
  - Phase 1 tilgung
  - Phase 2 tilgung
  - Phase 3 tilgung

Important rule:
- default mode should use normal financing logic
- expert phase mode is optional and must not allow nonsensical negative repayment behavior silently

Outputs:
- Monatsrate
- Zinsanteil initial
- Tilgungsanteil initial
- Restschuld nach 10 Jahren
- Restschuld nach Ende Zinsbindung
- kumulierte Zinsen bis Ende Zinsbindung

## Step 3 — Laufende Kosten

Fields:
- Hausgeld gesamt pro Monat
- nicht umlagefähiger Anteil pro Monat
- Instandhaltungspuffer pro Monat
- Verwaltungskosten pro Monat (optional)
- Leerstand in Prozent oder Monate/Jahr
- sonstige laufende Kosten pro Monat (optional)

Outputs:
- bereinigte Nettomiete
- laufende nicht umlagefähige Kosten
- monatlicher Cashflow
- Nettomietrendite
- Mindestmiete pro Monat
- Mindestmiete pro qm

## Step 4 — Steuer & Wertentwicklung

Fields:
- persönlicher Steuersatz
- Gebäudewert-Anteil oder alternativ Bodenwert-/Gebäudewert-Aufteilung
- AfA-Satz / Abschreibungslogik
- Zinsaufwand aus Finanzierung (auto from financing model)
- optionale Wertsteigerung pro Jahr

Important rule:
- tax view must be clearly separated from economic cashflow view
- value appreciation must never be mixed into monthly cashflow or presented as if it were guaranteed income

Outputs:
- Abschreibungsbasis
- jährliche AfA
- jährlicher steuerlicher Überschuss/Verlust (simplified)
- steuerlicher Effekt p.a.
- annualized view with and without appreciation assumptions

## Step 5 — Entscheidung & Szenarien

Scenarios:
- konservativ
- realistisch
- optimistisch

Default scenario logic proposal:
- konservativ: lower rent, higher costs, higher vacancy, higher follow-up interest
- realistisch: user inputs directly
- optimistisch: slightly better rent, stable costs, stable interest

Outputs:
- Cashflow per scenario
- Nettorendite per scenario
- Restschuld comparison
- tax effect comparison
- decision ampel
- top risk drivers

---

## Top KPIs shown in the summary header

Primary KPIs:
- Gesamtkosten
- Eigenkapitalbedarf
- Fremdkapitalbedarf
- Monatsrate
- Bruttomietrendite
- Nettomietrendite
- monatlicher Cashflow
- Mindestmiete pro qm

Secondary KPIs:
- Kaufpreis pro qm
- Gesamtinvest pro qm
- Restschuld nach 10 Jahren
- Restschuld nach Zinsbindung
- jährliche AfA
- steuerlicher Effekt p.a.
- konservativer Cashflow

---

## Decision logic for v1

Green = interesting
- cashflow around zero or positive
- net yield solid enough
- required rent looks realistic
- debt path plausible
- conservative scenario still acceptable

Yellow = review carefully
- slight negative cashflow
- decent yield but assumption-sensitive
- required rent needs verification
- tax result helps but does not rescue a weak operating case

Red = unattractive
- clearly negative cashflow
- weak net yield
- unrealistic required rent
- risky debt path / follow-up interest sensitivity
- conservative scenario breaks badly

Important:
- no single KPI decides alone
- value appreciation may inform upside but must not override weak core economics

---

## Explainability requirement

Every relevant field gets an info icon with:
- plain-language meaning
- input interpretation
- formula used
- one simple example
- warning if common misunderstandings exist

Examples:
- Bruttomietrendite
- Nettomietrendite
- Mindestmiete
- AfA
- Cashflow
- Restschuld
- tax effect

The user must be able to reproduce the numbers manually.

---

## Share-link and persistence model

v1 recommendation:
- save each calculation as a DB row with a generated public UUID/share token
- route pattern example: `/calc/:shareId`
- opening the share link restores all entered values and outputs
- delete button removes the saved calculation row and invalidates the link
- no login, no ownership model in v1

Potential DB tables:
- `property_calculations`
- `property_calculation_scenarios` (optional if scenario data is normalized)
- `formula_explanations` (optional seed/static content; could also live in code/config in v1)

---

## Recommended repository/app structure

Create under `/srv/apps/immo/app`:
- `docker-compose.yml`
- `.env`
- `backend/`
- `frontend/`
- `docs/`
- `CLAUDE.md`

Backend structure:
- `backend/src/app.ts`
- `backend/src/index.ts`
- `backend/src/db.ts`
- `backend/src/migrate.ts`
- `backend/src/routes/calculations.ts`
- `backend/src/routes/formulas.ts`
- `backend/src/routes/pdf.ts`
- `backend/src/services/calculationEngine.ts`
- `backend/src/services/scenarioEngine.ts`
- `backend/src/services/taxEngine.ts`
- `backend/src/services/pdfExport.ts`
- `backend/src/services/shareLinks.ts`
- `backend/src/migrations/001_initial.sql`

Frontend structure:
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/pages/NewCalculationPage.tsx`
- `frontend/src/pages/CalculationPage.tsx`
- `frontend/src/components/StepLayout.tsx`
- `frontend/src/components/InfoTooltip.tsx`
- `frontend/src/components/KpiCard.tsx`
- `frontend/src/components/AmpelBadge.tsx`
- `frontend/src/components/forms/Step1ObjectForm.tsx`
- `frontend/src/components/forms/Step2FinancingForm.tsx`
- `frontend/src/components/forms/Step3OperatingCostsForm.tsx`
- `frontend/src/components/forms/Step4TaxForm.tsx`
- `frontend/src/components/ScenarioTable.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/types.ts`
- `frontend/src/lib/formulas.ts`

---

## Data model proposal

### property_calculations
- id uuid primary key
- share_id text unique not null
- purchase_price numeric not null
- square_meters numeric not null
- cold_rent_monthly numeric not null
- transfer_tax_mode text not null
- transfer_tax_value numeric not null
- broker_mode text not null
- broker_value numeric not null
- notary_mode text not null
- notary_value numeric not null
- renovation_cost_mode text not null
- renovation_cost_value numeric not null
- equity_mode text not null
- equity_value numeric not null
- subsidy_amount numeric not null default 0
- interest_rate numeric null
- initial_repayment_rate numeric null
- fixed_interest_years integer null
- special_repayment_yearly numeric null
- followup_interest_rate numeric null
- condo_fee_monthly numeric null
- non_apportionable_costs_monthly numeric null
- maintenance_reserve_monthly numeric null
- admin_costs_monthly numeric null
- vacancy_rate numeric null
- other_monthly_costs numeric null
- tax_rate numeric null
- building_value_share numeric null
- depreciation_rate numeric null
- appreciation_rate numeric null
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()

Optional later:
- normalized financing phases table if expert mode becomes first-class

---

## Formula discipline

Rules:
- all KPI formulas live centrally in calculation services
- frontend may display formulas, but backend is source of truth
- every formula needs a human-readable explanation
- no hidden assumption should affect the user-facing result without being visible

---

## Implementation phases

### Phase 0 — foundation
- create new app skeleton at `/srv/apps/immo/app`
- docker compose
- frontend/backend boot
- PostgreSQL setup
- NPM proxy mapping plan for `immo.magicplanet.net`

### Phase 1 — base calculation flow
- step forms 1–3
- save calculation
- load by share ID
- summary KPIs
- basic ampel

### Phase 2 — tax & scenario layer
- tax input step
- AfA / annual tax effect
- scenario engine
- decision page improvements

### Phase 3 — explainability & PDF
- info tooltip content
- formula explanation rendering
- PDF export
- deletion flow with invalidated link

---

## Risks to watch

- mixing tax logic into operating cashflow and confusing the user
- allowing flexible financing phases that produce nonsense outputs silently
- using appreciation to make weak deals look good
- too many fields too early, killing usability
- insufficient explainability for derived KPIs

---

## Recommendation before implementation

Implement the MVP as:
- public tool
- persistent share links
- no login
- clear separation of economics vs tax view
- info tooltip behind each field and major KPI
- standard financing mode first, expert phase mode only if still needed after the first working version
