import { KPI_DEFINITIONS } from '../../domain/finance/kpis';

const QUICK_VIEW_IDS = ['bruttomietrendite', 'nettomietrendite', 'kaufpreisfaktor', 'kaufpreisfaktorAllIn'];

export function KPIDefinitions() {
  const definitions = KPI_DEFINITIONS.filter((d) => QUICK_VIEW_IDS.includes(d.id));

  return (
    <section aria-label="KPI-Erläuterungen" className="kpi-definitions">
      <h3 className="kpi-definitions-heading">KPI-Erläuterungen</h3>
      {definitions.map((def) => (
        <div key={def.id} className="kpi-definition-entry">
          <h4 className="kpi-definition-title">{def.displayName}</h4>
          <dl className="kpi-definition-details">
            <div className="kpi-definition-row">
              <dt>Bedeutung</dt>
              <dd>{def.bedeutung}</dd>
            </div>
            <div className="kpi-definition-row kpi-definition-row--compact">
              <dt>Eingaben</dt>
              <dd>{def.eingaben.join(', ')}</dd>
            </div>
            <div className="kpi-definition-row kpi-definition-row--compact" style={{ marginTop: '0.5rem' }}>
              <dt>Formel</dt>
              <dd><code className="kpi-definition-formula">{def.formel}</code></dd>
            </div>
          </dl>
        </div>
      ))}
    </section>
  );
}
