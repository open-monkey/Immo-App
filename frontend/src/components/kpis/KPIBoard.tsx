import { useImmoStore } from '../../state/useImmoStore';
import { KPICard } from '../ui/KPICard';

const QUICK_VIEW_KPI_IDS = [
  'bruttomietrendite',
  'nettomietrendite',
  'kaufpreisfaktor',
  'kaufpreisfaktorAllIn',
] as const;

export function KPIBoard() {
  const kpis = useImmoStore((state) => state.result.kpis);

  return (
    <section aria-label="Schnellsicht KPIs" className="kpi-board">
      {QUICK_VIEW_KPI_IDS.map((id) => (
        <KPICard
          key={id}
          kpi={kpis[id]}
        />
      ))}
    </section>
  );
}
