import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FinanzierungSection } from '@/components/sections/FinanzierungSection';
import { KaufnebenkostenSection } from '@/components/sections/KaufnebenkostenSection';
import { KostenSection } from '@/components/sections/KostenSection';
import { MieteSection } from '@/components/sections/MieteSection';
import { ObjektSection } from '@/components/sections/ObjektSection';
import { RisikoSection } from '@/components/sections/RisikoSection';
import { SanierungSection } from '@/components/sections/SanierungSection';
import { SteuerSection } from '@/components/sections/SteuerSection';
import { CashflowSection } from '@/components/sections/CashflowSection';
import { TilgungsplanSection } from '@/components/sections/TilgungsplanSection';
import { WertentwicklungSection } from '@/components/sections/WertentwicklungSection';
import { KPICard } from '@/components/ui/KPICard';
import { DecisionPanel } from '@/components/kpis/DecisionPanel';
import { KPIDefinitions } from '@/components/kpis/KPIDefinitions';
import { KPIBoard } from '@/components/kpis/KPIBoard';
import { ScenarioComparisonSection } from '@/components/kpis/ScenarioComparisonSection';
import { TaxResultsSection } from '@/components/kpis/TaxResultsSection';
import { KPISectionBoard } from '@/components/kpis/KPISectionBoard';
import { saveCalculation } from '@/api/shareLinks';
import { exportPDF } from '@/components/pdf/ReportTemplate';
import { Button } from '@/components/ui/Button';
import { de } from '@/i18n/de';
import { serialize } from '@/domain/finance/serialization';
import {
  createFormValuesFromInputs,
  getDefaultGrunderwerbsteuerUiValue,
  InputsSchema,
  type InputsFormValues,
  parseInputsFormValues,
} from '@/schemas/inputs';
import { useImmoStore } from '@/state/useImmoStore';
import { useUiStore } from '@/state/useUiStore';

function DSCRCard() {
  const kpis = useImmoStore((state) => state.result.kpis);
  const dscr = kpis.dscr;
  if (!dscr || dscr.value === null) return null;
  return <div style={{ marginTop: 'var(--sp-4)' }}><KPICard kpi={dscr} /></div>;
}

export function DashboardPage() {
  const currentInputs = useImmoStore((state) => state.inputs);
  const setInputs = useImmoStore((state) => state.setInputs);
  const result = useImmoStore((state) => state.result);
  const sections = useUiStore((state) => state.sections);
  const setSectionOpen = useUiStore((state) => state.setSectionOpen);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [autoSyncKaltmiete, setAutoSyncKaltmiete] = useState(true);

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const serialized = serialize(useImmoStore.getState().inputs);
      const shareId = await saveCalculation(serialized);
      const url = `${window.location.origin}/s/${shareId}`;
      await navigator.clipboard.writeText(url);
      setSaveMessage(de.actions.saveSuccess);
    } catch {
      setSaveMessage(de.actions.saveError);
    } finally {
      setSaving(false);
    }
  }

  const form = useForm<InputsFormValues>({
    resolver: zodResolver(InputsSchema),
    defaultValues: createFormValuesFromInputs(currentInputs),
    mode: 'onChange',
  });

  const watchedValues = (useWatch({ control: form.control }) ?? form.getValues()) as InputsFormValues;
  const { errors, dirtyFields } = form.formState;

  useEffect(() => {
    const parsed = parseInputsFormValues(watchedValues);
    if (parsed.success) {
      setInputs(parsed.data);
    }
  }, [setInputs, watchedValues]);

  useEffect(() => {
    if (!autoSyncKaltmiete) return;
    const bePerQm = result.kpis.breakEvenMieteProQmLiquiditaet?.value?.toNumber();
    const flaeche = parseFloat(watchedValues.wohnflaecheQm ?? '');
    if (bePerQm == null || !isFinite(bePerQm) || !flaeche || flaeche <= 0) return;
    const target = (bePerQm * flaeche).toFixed(2);
    if (watchedValues.monatsnettokaltmiete !== target) {
      form.setValue('monatsnettokaltmiete', target, { shouldDirty: false, shouldValidate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSyncKaltmiete, result.kpis.breakEvenMieteProQmLiquiditaet?.value?.toString(), watchedValues.wohnflaecheQm, watchedValues.monatsnettokaltmiete, form]);

  function handleManualKaltmieteChange() {
    setAutoSyncKaltmiete(false);
  }

  function handleAutoSyncKaltmieteChange(next: boolean) {
    setAutoSyncKaltmiete(next);
  }

  useEffect(() => {
    if (watchedValues.kaufnebenkostenModus !== 'detailliert') {
      return;
    }

    if (dirtyFields.grunderwerbsteuerSatz) {
      return;
    }

    const nextValue = getDefaultGrunderwerbsteuerUiValue(watchedValues.bundesland);
    if (watchedValues.grunderwerbsteuerSatz !== nextValue) {
      form.setValue('grunderwerbsteuerSatz', nextValue, { shouldDirty: false, shouldValidate: true });
    }
  }, [dirtyFields.grunderwerbsteuerSatz, form, watchedValues.bundesland, watchedValues.grunderwerbsteuerSatz, watchedValues.kaufnebenkostenModus]);

  return (
    <main className="page-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">immo.magicplanet.net</p>
          <h1>{de.title}</h1>
          <p className="app-subtitle">{de.subtitle}</p>
        </div>
        <div className="header-actions" aria-label="Aktionen">
          <div>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => { void handleSave(); }}>
              {saving ? '…' : de.actions.save}
            </Button>
            {saveMessage && <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>{saveMessage}</span>}
          </div>
          <Button type="button" variant="secondary" onClick={() => {
            const { inputs, result } = useImmoStore.getState();
            exportPDF(inputs, result);
          }}>
            {de.actions.exportPdf}
          </Button>
        </div>
      </header>

      <div className="dashboard-grid dashboard-grid--phase2">
        <form className="dashboard-form" onSubmit={(event) => event.preventDefault()}>
          <ObjektSection register={form.register} errors={errors} isOpen={sections.objekt} onToggle={(next) => setSectionOpen('objekt', next)} />
          <KaufnebenkostenSection register={form.register} errors={errors} values={watchedValues} isOpen={sections.kaufnebenkosten} onToggle={(next) => setSectionOpen('kaufnebenkosten', next)} />
          <SanierungSection register={form.register} errors={errors} isOpen={sections.sanierung} onToggle={(next) => setSectionOpen('sanierung', next)} />
          <FinanzierungSection register={form.register} errors={errors} values={watchedValues} isOpen={sections.finanzierung} onToggle={(next) => setSectionOpen('finanzierung', next)} />
          <MieteSection register={form.register} errors={errors} isOpen={sections.miete} onToggle={(next) => setSectionOpen('miete', next)} control={form.control} autoSyncKaltmiete={autoSyncKaltmiete} onAutoSyncKaltmieteChange={handleAutoSyncKaltmieteChange} onManualKaltmieteChange={handleManualKaltmieteChange} />
          <KostenSection register={form.register} errors={errors} values={watchedValues} isOpen={sections.kosten} onToggle={(next) => setSectionOpen('kosten', next)} />
          <RisikoSection register={form.register} errors={errors} isOpen={sections.risiko} onToggle={(next) => setSectionOpen('risiko', next)} />
          <SteuerSection register={form.register} errors={errors} values={watchedValues} isOpen={sections.steuer} onToggle={(next) => setSectionOpen('steuer', next)} />
          <TilgungsplanSection isOpen={sections.tilgungsplan} onToggle={(next) => setSectionOpen('tilgungsplan', next)} />
          <CashflowSection isOpen={sections.cashflow} onToggle={(next) => setSectionOpen('cashflow', next)} />
          <WertentwicklungSection isOpen={sections.wertentwicklung} onToggle={(next) => setSectionOpen('wertentwicklung', next)} />
        </form>

        <aside className="dashboard-sidebar">
          <KPIBoard />
          <DSCRCard />
          <DecisionPanel />
          <KPISectionBoard />
          <ScenarioComparisonSection />
          <TaxResultsSection />
          <KPIDefinitions />
        </aside>
      </div>
    </main>
  );
}
