import { useImmoStore } from '@/state/useImmoStore';
import { formatValueByFormat } from '@/lib/formatting';

export function ScenarioComparisonSection() {
  const scenarios = useImmoStore((state) => state.result.scenarios);

  return (
    <section aria-label="Szenariovergleich" className="scenario-section">
      <h3 className="scenario-section-heading">Szenariovergleich</h3>
      <p className="scenario-section-description">
        Drei Blickwinkel auf denselben Deal: konservativ, realistisch und optimistisch.
      </p>
      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="scenario-card">
            <header className="scenario-card-header">
              <h4 className="scenario-card-title">{scenario.label}</h4>
              <p className="scenario-card-assumptions">
                Miete {formatValueByFormat(scenario.assumptions.mietDeltaPct.mul(100), 'percent')}, Kosten {formatValueByFormat(scenario.assumptions.bewirtschaftungskostenDeltaPct.mul(100), 'percent')}, Anschlusszins {formatValueByFormat(scenario.assumptions.anschlusszinsDeltaPct.mul(100), 'percent')}
              </p>
            </header>
            <dl className="scenario-metrics">
              <div>
                <dt>Cashflow vor Steuern Jahr 1</dt>
                <dd>{formatValueByFormat(scenario.kpis.cashflowVorSteuernJahr1, 'currency')}</dd>
              </div>
              <div>
                <dt>Nettomietrendite</dt>
                <dd>{formatValueByFormat(scenario.kpis.nettomietrendite, 'percent')}</dd>
              </div>
              <div>
                <dt>Restschuld Ende Betrachtung</dt>
                <dd>{formatValueByFormat(scenario.kpis.restschuldEndeBetrachtung, 'currency')}</dd>
              </div>
              <div>
                <dt>Cashflow nach Steuern Jahr 1</dt>
                <dd>{formatValueByFormat(scenario.kpis.cashflowNachSteuernJahr1, 'currency')}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
