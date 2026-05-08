import { useImmoStore } from '../../state/useImmoStore';
import { KPICard } from '../ui/KPICard';
import type { KPIValue } from '../../domain/finance/types';

const CATEGORY_ORDER = [
  'Rendite',
  'Break-even',
  'Cashflow',
  'Finanzierung',
] as const;

type RenderedCategory = (typeof CATEGORY_ORDER)[number];

const EXCLUDED_CATEGORIES = new Set<string>(['Schnellsicht', 'Steuer', 'Wertentwicklung', 'Risiko', 'Markt']);

export function KPISectionBoard() {
  const kpis = useImmoStore((state) => state.result.kpis);

  const grouped = new Map<RenderedCategory, KPIValue[]>();
  for (const category of CATEGORY_ORDER) {
    grouped.set(category, []);
  }

  for (const kpi of Object.values(kpis)) {
    const cat = kpi.metadata.kategorie;
    if (EXCLUDED_CATEGORIES.has(cat)) continue;
    const list = grouped.get(cat as RenderedCategory);
    if (list) list.push(kpi);
  }

  return (
    <>
      {CATEGORY_ORDER.map((category) => {
        const list = grouped.get(category) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={category} aria-label={`${category} KPIs`} className="kpi-board">
            <h3 className="kpi-board-heading">{category}</h3>
            {list.map((kpi) => (
              <KPICard key={kpi.metadata.id} kpi={kpi} />
            ))}
          </section>
        );
      })}
    </>
  );
}
