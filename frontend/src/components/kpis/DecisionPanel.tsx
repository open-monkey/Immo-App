import { useImmoStore } from '@/state/useImmoStore';

const AMPEL_LABELS = {
  green: 'Grün',
  yellow: 'Gelb',
  red: 'Rot',
} as const;

export function DecisionPanel() {
  const decision = useImmoStore((state) => state.result.decision);

  return (
    <section aria-label="Entscheidung" className={`decision-panel decision-panel--${decision.ampel}`}>
      <h3 className="decision-panel-heading">Entscheidung</h3>
      <p className="decision-panel-ampel">Ampel: {AMPEL_LABELS[decision.ampel]}</p>
      <p className="decision-panel-summary">{decision.summary}</p>
      {decision.riskDrivers.length > 0 ? (
        <ul className="decision-panel-risks">
          {decision.riskDrivers.map((driver) => (
            <li key={driver}>{driver}</li>
          ))}
        </ul>
      ) : (
        <p className="decision-panel-summary">Keine akuten Risikotreiber im aktuellen Modell.</p>
      )}
    </section>
  );
}
