# Break-Even Kaltmiete Autosync Implementation Plan

> **For Hermes:** Delegate this implementation to Claude Code. Keep the block limited to frontend UI/form behavior and tests.

**Goal:** When `breakEvenMieteProQmLiquiditaet` changes, `monatsnettokaltmiete` should automatically follow it by default, while still allowing the user to manually control the rent when desired.

**Architecture:** Add a small frontend-only autosync state around the rent form field. Default autosync is enabled. While enabled, derive monthly rent as `breakEvenMieteProQmLiquiditaet * wohnflaecheQm` and write it to `monatsnettokaltmiete` without marking the field dirty. If the user edits the monthly rent field, disable autosync so manual input is preserved. Provide an explicit UI control in the rent section to re-enable/disable autosync.

**Tech Stack:** React 18, react-hook-form, Zustand store, Vitest + Testing Library.

---

## Scope

### Target area

- Frontend only.
- Expected files:
  - `frontend/src/pages/DashboardPage.tsx`
  - `frontend/src/components/sections/MieteSection.tsx`
  - `frontend/tests/...` or a new focused test file under `frontend/tests/`
  - `frontend/src/i18n/de.ts` only if labels/help text are added there.

### Non-goals

- Do not change finance formulas in `frontend/src/domain/finance/*` unless a test proves the formula is wrong.
- Do not change backend, Docker, persistence, share-link, PDF, deployment config.
- Do not deploy.
- Do not broaden to unrelated UI cleanup.

## Desired behavior

1. Default: autosync enabled on first load.
2. When autosync is enabled and `breakEvenMieteProQmLiquiditaet` is available:
   - set `monatsnettokaltmiete = breakEvenMieteProQmLiquiditaet * wohnflaecheQm`
   - round to 2 decimals for the form string
   - use `form.setValue('monatsnettokaltmiete', value, { shouldDirty: false, shouldValidate: true })`
3. When any input that changes Break-Even Liquidität changes, the monthly rent follows automatically while autosync remains enabled.
4. The user can manually control rent:
   - either by disabling a visible autosync control, or
   - by typing directly into the `monatsnettokaltmiete` field, which should disable autosync.
5. Re-enabling autosync immediately sets rent to the current Break-Even Liquidität value and resumes following future changes.
6. Avoid render loops:
   - only call `setValue` if the rounded target string differs from the current form value.
7. Do not mark rent dirty for automatic sync writes; manual edits can be dirty.

## Implementation tasks

### Task 1: Add a failing UI test for default autosync

**Objective:** Prove that changing a Break-Even-relevant input updates monthly rent automatically.

**Suggested test setup:**

- Render `<App />` with stores reset as in `frontend/tests/WertentwicklungSection.test.tsx`.
- Ensure Miete and Finanzierung/Kosten/Risiko sections are open via `useUiStore.setState`.
- Locate the monthly rent input by label `/Monatliche Nettokaltmiete/i`.
- Change a Break-Even-relevant input, preferably `Bausparvertrag monatlich` if label is stable, or another simple input that affects `breakEvenMieteProQmLiquiditaet`.
- Assert that the monthly rent input value changes from its initial value.
- Assert the new value approximately equals current store result `breakEvenMieteProQmLiquiditaet * wohnflaecheQm` rounded to 2 decimals.

**Run:**

```bash
cd /srv/apps/immo/app/frontend && npm run test -- tests/<new-test-file>.test.tsx -t "autosync"
```

**Expected RED:** fails because no autosync exists.

### Task 2: Implement minimal autosync state and effect

**Objective:** Make default autosync work without touching formulas.

**Suggested implementation:**

- In `DashboardPage.tsx`, add local state:
  - `const [autoSyncKaltmiete, setAutoSyncKaltmiete] = useState(true);`
- Get current computed result from store:
  - `const result = useImmoStore((state) => state.result);`
- Add helper in `DashboardPage.tsx` or local function:
  - compute target string from `result.kpis.breakEvenMieteProQmLiquiditaet?.value` and parsed/available `wohnflaecheQm`.
- Add `useEffect` that depends on:
  - `autoSyncKaltmiete`
  - `result.kpis.breakEvenMieteProQmLiquiditaet?.value?.toString()`
  - `watchedValues.wohnflaecheQm`
  - `watchedValues.monatsnettokaltmiete`
- If autosync enabled and target available and differs from current form value:
  - `form.setValue('monatsnettokaltmiete', target, { shouldDirty: false, shouldValidate: true });`

### Task 3: Add/manual override UI

**Objective:** Let the user control rent manually.

**Suggested implementation:**

- Extend `MieteSection` props with:
  - `autoSyncKaltmiete: boolean`
  - `onAutoSyncKaltmieteChange: (next: boolean) => void`
  - optionally a custom `monatsnettokaltmieteRegistration` or `onManualKaltmieteChange` if needed.
- Add a visible checkbox/toggle near monthly rent:
  - Label suggestion: `Kaltmiete automatisch auf Break-Even Liquidität setzen`
  - Help text suggestion: `Wenn aktiv, folgt die Nettokaltmiete dem Break-Even Liquidität. Deaktivieren oder Feld bearbeiten für manuelle Miete.`
- Ensure direct manual edits disable autosync. The easiest path:
  - in `DashboardPage.tsx`, wrap the register result for `monatsnettokaltmiete` and add an `onChange` handler that calls the original RHF `onChange` and then `setAutoSyncKaltmiete(false)` if the change event is user-initiated.
  - Pass this registration into `MieteSection` instead of calling `register('monatsnettokaltmiete')` inside the component.
- Alternative acceptable path: checkbox/toggle only. If this path is chosen, test and UI copy must make it clear that the user disables autosync before manual editing. Preference is direct-edit-disables-autosync.

### Task 4: Add tests for manual override and re-enable

**Objective:** Prevent regressions in the user-control behavior.

Test cases:

1. Manual edit disables autosync and preserves manual value when Break-Even changes.
2. Re-enabling autosync sets monthly rent to current Break-Even value and follows later Break-Even changes.

Use Testing Library user events or `fireEvent.change`; keep tests deterministic by reading expected values from `useImmoStore.getState().result` after form updates.

### Task 5: Verify full frontend

Run:

```bash
cd /srv/apps/immo/app/frontend && npm run test
cd /srv/apps/immo/app/frontend && npm run build
```

Expected:

- all tests pass
- build succeeds
- existing React Router future warnings and bundle-size warning are acceptable if unchanged

### Task 6: Handover

Update `/home/martin/hermes-workspace/docs/handover/immo-latest.md` with:

- status
- touched files
- tests run
- whether any user input is needed
- exact next step

Do not deploy unless Hermes explicitly does that after review.
