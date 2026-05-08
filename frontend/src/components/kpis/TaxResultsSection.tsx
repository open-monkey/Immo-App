import { useImmoStore } from '@/state/useImmoStore';
import { isSteuerModulAktivUndVollstaendig } from '@/domain/finance/tax';
import { KPICard } from '../ui/KPICard';

const TAX_RESULT_KPI_IDS = [
  'afaJaehrlich',
  'steuerlicherUeberschussJahr1',
  'steuerlasterJahr1',
  'cashflowNachSteuernJahr1',
] as const;

export function TaxResultsSection() {
  const inputs = useImmoStore((state) => state.inputs);
  const kpis = useImmoStore((state) => state.result.kpis);

  if (!isSteuerModulAktivUndVollstaendig(inputs)) {
    return null;
  }

  return (
    <section aria-label="Steuer-Layer Jahr 1" className="tax-results-section">
      <h3 className="tax-results-heading">Steuer-Layer Jahr 1</h3>
      <p className="tax-results-description">
        Separate Steuerbetrachtung für Jahr 1. Vor-Steuer-KPIs bleiben davon fachlich getrennt.
      </p>
      <div className="kpi-board">
        {TAX_RESULT_KPI_IDS.map((id) => (
          <KPICard key={id} kpi={kpis[id]} />
        ))}
      </div>
    </section>
  );
}
